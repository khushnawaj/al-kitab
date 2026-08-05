import { Recitation } from '../models/Recitation.js';
export class RecitationRepository {
    async findById(id) {
        return Recitation.findById(id);
    }
    async findByUserId(userId) {
        return Recitation.find({ user: userId }).sort({ date: -1 });
    }
    async findWithPagination(userId, filters, sortField = 'date', sortOrder = 'desc', page = 1, limit = 10) {
        const query = { user: userId };
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
        const sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };
        const [recitations, total] = await Promise.all([
            Recitation.find(query).sort(sort).skip(skip).limit(limit),
            Recitation.countDocuments(query),
        ]);
        return { recitations, total };
    }
    async create(recitationData) {
        const recitation = new Recitation(recitationData);
        return recitation.save();
    }
    async update(id, updateData) {
        return Recitation.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    }
    async delete(id) {
        return Recitation.findByIdAndDelete(id);
    }
    async deleteAllByUserId(userId) {
        return Recitation.deleteMany({ user: userId });
    }
}
export const recitationRepository = new RecitationRepository();
