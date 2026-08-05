import { recitationRepository, RecitationFilters } from '../repositories/RecitationRepository.js';
import { SURAHS } from '../constants/surahs.js';
import { IRecitation } from '../models/Recitation.js';

export class RecitationService {
  async getRecitation(userId: string, id: string) {
    const recitation = await recitationRepository.findById(id);
    if (!recitation || recitation.user.toString() !== userId) {
      throw { status: 404, message: 'Recitation record not found' };
    }
    return recitation;
  }

  async listRecitations(
    userId: string,
    filters: RecitationFilters,
    sortField: string,
    sortOrder: 'asc' | 'desc',
    page: number,
    limit: number
  ) {
    return recitationRepository.findWithPagination(userId, filters, sortField, sortOrder, page, limit);
  }

  async createRecitation(userId: string, data: {
    date: Date;
    surahNumber: number;
    type: 'entire' | 'custom';
    fromAyah?: number;
    toAyah?: number;
    notes?: string;
  }) {
    const surah = SURAHS.find(s => s.number === data.surahNumber);
    if (!surah) {
      throw { status: 400, message: 'Invalid Surah number' };
    }

    let ayahCount = 0;
    let fromAyah = data.fromAyah;
    let toAyah = data.toAyah;

    if (data.type === 'entire') {
      ayahCount = surah.totalAyahs;
      fromAyah = 1;
      toAyah = surah.totalAyahs;
    } else {
      if (fromAyah === undefined || toAyah === undefined) {
        throw { status: 400, message: 'Custom recitation requires fromAyah and toAyah' };
      }
      if (fromAyah > toAyah) {
        throw { status: 400, message: 'fromAyah cannot be greater than toAyah' };
      }
      if (toAyah > surah.totalAyahs) {
        throw { status: 400, message: `toAyah cannot exceed Surah total Ayahs (${surah.totalAyahs})` };
      }
      ayahCount = toAyah - fromAyah + 1;
    }

    return recitationRepository.create({
      user: userId as any,
      date: data.date,
      surahNumber: data.surahNumber,
      surahName: surah.transliteration,
      type: data.type,
      fromAyah,
      toAyah,
      ayahCount,
      notes: data.notes,
    });
  }

  async updateRecitation(userId: string, id: string, data: {
    date?: Date;
    surahNumber?: number;
    type?: 'entire' | 'custom';
    fromAyah?: number;
    toAyah?: number;
    notes?: string;
  }) {
    const recitation = await recitationRepository.findById(id);
    if (!recitation || recitation.user.toString() !== userId) {
      throw { status: 404, message: 'Recitation record not found' };
    }

    const surahNumber = data.surahNumber !== undefined ? data.surahNumber : recitation.surahNumber;
    const type = data.type !== undefined ? data.type : recitation.type;
    let fromAyah = data.fromAyah !== undefined ? data.fromAyah : recitation.fromAyah;
    let toAyah = data.toAyah !== undefined ? data.toAyah : recitation.toAyah;

    const surah = SURAHS.find(s => s.number === surahNumber);
    if (!surah) {
      throw { status: 400, message: 'Invalid Surah number' };
    }

    let ayahCount = recitation.ayahCount;

    if (type === 'entire') {
      ayahCount = surah.totalAyahs;
      fromAyah = 1;
      toAyah = surah.totalAyahs;
    } else {
      if (fromAyah === undefined || toAyah === undefined) {
        throw { status: 400, message: 'Custom recitation requires fromAyah and toAyah' };
      }
      if (fromAyah > toAyah) {
        throw { status: 400, message: 'fromAyah cannot be greater than toAyah' };
      }
      if (toAyah > surah.totalAyahs) {
        throw { status: 400, message: `toAyah cannot exceed Surah total Ayahs (${surah.totalAyahs})` };
      }
      ayahCount = toAyah - fromAyah + 1;
    }

    return recitationRepository.update(id, {
      date: data.date !== undefined ? data.date : recitation.date,
      surahNumber,
      surahName: surah.transliteration,
      type,
      fromAyah,
      toAyah,
      ayahCount,
      notes: data.notes !== undefined ? data.notes : recitation.notes,
    });
  }

  async deleteRecitation(userId: string, id: string) {
    const recitation = await recitationRepository.findById(id);
    if (!recitation || recitation.user.toString() !== userId) {
      throw { status: 404, message: 'Recitation record not found' };
    }
    await recitationRepository.delete(id);
    return recitation;
  }

  async exportData(userId: string) {
    return recitationRepository.findByUserId(userId);
  }

  async importData(userId: string, data: any[]) {
    if (!Array.isArray(data)) {
      throw { status: 400, message: 'Import data must be a JSON array' };
    }

    const recordsToInsert = [];

    for (const item of data) {
      // Validate item
      if (!item.date || !item.surahNumber || !item.type) {
        throw { status: 400, message: 'Missing required fields in import items' };
      }
      const surah = SURAHS.find(s => s.number === item.surahNumber);
      if (!surah) {
        throw { status: 400, message: `Invalid Surah number ${item.surahNumber} in import` };
      }

      let fromAyah = item.fromAyah;
      let toAyah = item.toAyah;
      let ayahCount = 0;

      if (item.type === 'entire') {
        ayahCount = surah.totalAyahs;
        fromAyah = 1;
        toAyah = surah.totalAyahs;
      } else {
        if (fromAyah === undefined || toAyah === undefined) {
          throw { status: 400, message: `Custom recitation for Surah ${surah.transliteration} requires fromAyah and toAyah` };
        }
        ayahCount = toAyah - fromAyah + 1;
      }

      recordsToInsert.push({
        user: userId as any,
        date: new Date(item.date),
        surahNumber: item.surahNumber,
        surahName: surah.transliteration,
        type: item.type,
        fromAyah,
        toAyah,
        ayahCount,
        notes: item.notes || '',
      });
    }

    // Insert records. We can delete old ones first or append. The standard setting export/import usually appends or overwrites. Let's append, which is safer.
    const inserted = await Promise.all(
      recordsToInsert.map(record => recitationRepository.create(record))
    );
    return { count: inserted.length };
  }
}
export const recitationService = new RecitationService();
