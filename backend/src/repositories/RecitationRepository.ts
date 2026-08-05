import { Recitation, IRecitation } from '../models/Recitation.js';

export interface RecitationFilters {
  surahNumber?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class RecitationRepository {
  async findById(id: string): Promise<IRecitation | null> {
    return Recitation.findById(id);
  }

  async findByUserId(userId: string): Promise<IRecitation[]> {
    return Recitation.find({ user: userId }).sort({ date: -1 });
  }

  async findWithPagination(
    userId: string,
    filters: RecitationFilters,
    sortField: string = 'date',
    sortOrder: 'asc' | 'desc' = 'desc',
    page: number = 1,
    limit: number = 10
  ): Promise<{ recitations: IRecitation[]; total: number }> {
    const query: any = { user: userId };

    if (filters.surahNumber) {
      query.surahNumber = filters.surahNumber;
    }

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate;
      }
    }

    if (filters.search) {
      query.$or = [
        { surahName: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortField]: sortOrder === 'desc' ? -1 : 1 };

    const [recitations, total] = await Promise.all([
      Recitation.find(query).sort(sort).skip(skip).limit(limit),
      Recitation.countDocuments(query),
    ]);

    return { recitations, total };
  }

  async create(recitationData: Partial<IRecitation>): Promise<IRecitation> {
    const recitation = new Recitation(recitationData);
    return recitation.save();
  }

  async update(id: string, updateData: Partial<IRecitation>): Promise<IRecitation | null> {
    return Recitation.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  async delete(id: string): Promise<IRecitation | null> {
    return Recitation.findByIdAndDelete(id);
  }

  async deleteAllByUserId(userId: string): Promise<any> {
    return Recitation.deleteMany({ user: userId });
  }
}
export const recitationRepository = new RecitationRepository();
