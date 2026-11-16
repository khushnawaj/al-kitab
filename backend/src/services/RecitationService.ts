import { recitationRepository, RecitationFilters } from '../repositories/RecitationRepository.js';
import { SURAHS } from '../constants/surahs.js';
import { IRecitation } from '../models/Recitation.js';

export interface RecitationResolution {
  surahNumber: number;
  surahName: string;
  type: 'entire' | 'custom';
  ayahCount: number;
  fromAyah?: number;
  toAyah?: number;
}

export function resolveRecitationDetails(data: {
  surahNumber?: number;
  surahName?: string;
  type?: 'entire' | 'custom';
  ayahCount?: number;
  fromAyah?: number;
  toAyah?: number;
}): RecitationResolution {
  const surahNumber = data.surahNumber || 0;
  const surah = SURAHS.find(s => s.number === surahNumber);
  let surahName = data.surahName || (surah ? surah.transliteration : 'Custom Recitation');
  const type = data.type || 'custom';
  let ayahCount = data.ayahCount || 0;
  let fromAyah = data.fromAyah;
  let toAyah = data.toAyah;

  if (type === 'entire' && surah) {
    ayahCount = surah.totalAyahs;
    fromAyah = 1;
    toAyah = surah.totalAyahs;
  } else if (surah && fromAyah !== undefined && toAyah !== undefined) {
    if (fromAyah > toAyah) {
      throw { status: 400, message: 'fromAyah cannot be greater than toAyah' };
    }
    if (toAyah > surah.totalAyahs) {
      throw { status: 400, message: `toAyah cannot exceed Surah total Ayahs (${surah.totalAyahs})` };
    }
    ayahCount = toAyah - fromAyah + 1;
  } else {
    // Custom or freeform recitation
    if (!ayahCount || ayahCount < 1) {
      ayahCount = 1;
    }
  }

  return {
    surahNumber,
    surahName,
    type,
    ayahCount,
    fromAyah,
    toAyah,
  };
}

export class RecitationService {
  async getRecitation(userId: string, id: string): Promise<IRecitation> {
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
    surahNumber?: number;
    surahName?: string;
    type?: 'entire' | 'custom';
    ayahCount?: number;
    fromAyah?: number;
    toAyah?: number;
    notes?: string;
  }) {
    const resolved = resolveRecitationDetails(data);

    return recitationRepository.create({
      user: userId as any,
      date: data.date,
      surahNumber: resolved.surahNumber,
      surahName: resolved.surahName,
      type: resolved.type,
      fromAyah: resolved.fromAyah,
      toAyah: resolved.toAyah,
      ayahCount: resolved.ayahCount,
      notes: data.notes,
    });
  }

  async updateRecitation(userId: string, id: string, data: {
    date?: Date;
    surahNumber?: number;
    surahName?: string;
    type?: 'entire' | 'custom';
    ayahCount?: number;
    fromAyah?: number;
    toAyah?: number;
    notes?: string;
  }) {
    const recitation = await recitationRepository.findById(id);
    if (!recitation || recitation.user.toString() !== userId) {
      throw { status: 404, message: 'Recitation record not found' };
    }

    const resolved = resolveRecitationDetails({
      surahNumber: data.surahNumber !== undefined ? data.surahNumber : recitation.surahNumber,
      surahName: data.surahName !== undefined ? data.surahName : recitation.surahName,
      type: data.type !== undefined ? data.type : recitation.type,
      fromAyah: data.fromAyah !== undefined ? data.fromAyah : recitation.fromAyah,
      toAyah: data.toAyah !== undefined ? data.toAyah : recitation.toAyah,
      ayahCount: data.ayahCount !== undefined ? data.ayahCount : recitation.ayahCount,
    });

    return recitationRepository.update(id, {
      date: data.date !== undefined ? data.date : recitation.date,
      surahNumber: resolved.surahNumber,
      surahName: resolved.surahName,
      type: resolved.type,
      fromAyah: resolved.fromAyah,
      toAyah: resolved.toAyah,
      ayahCount: resolved.ayahCount,
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
      if (!item.date) {
        throw { status: 400, message: 'Missing date field in import items' };
      }

      const resolved = resolveRecitationDetails({
        surahNumber: item.surahNumber,
        surahName: item.surahName,
        type: item.type,
        ayahCount: item.ayahCount,
        fromAyah: item.fromAyah,
        toAyah: item.toAyah,
      });

      recordsToInsert.push({
        user: userId as any,
        date: new Date(item.date),
        surahNumber: resolved.surahNumber,
        surahName: resolved.surahName,
        type: resolved.type,
        fromAyah: resolved.fromAyah,
        toAyah: resolved.toAyah,
        ayahCount: resolved.ayahCount,
        notes: item.notes || '',
      });
    }

    const inserted = await Promise.all(
      recordsToInsert.map(record => recitationRepository.create(record))
    );
    return { count: inserted.length };
  }
}

export const recitationService = new RecitationService();
