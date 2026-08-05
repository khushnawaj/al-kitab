import { counterRepository } from '../repositories/CounterRepository.js';
import { SURAHS } from '../constants/surahs.js';
export class CounterService {
    async getCounter(userId, id) {
        const counter = await counterRepository.findById(id);
        if (!counter || counter.user.toString() !== userId) {
            throw { status: 404, message: 'Counter not found' };
        }
        return counter;
    }
    async listCounters(userId) {
        return counterRepository.findByUserId(userId);
    }
    async createCounter(userId, data) {
        let name = data.name;
        if (data.surahNumber) {
            const surah = SURAHS.find(s => s.number === data.surahNumber);
            if (!surah) {
                throw { status: 400, message: 'Invalid Surah number' };
            }
            name = `Surah ${surah.transliteration}`;
        }
        return counterRepository.create({
            user: userId,
            name,
            surahNumber: data.surahNumber,
            fromAyah: data.fromAyah,
            toAyah: data.toAyah,
            dailyTarget: data.dailyTarget,
            fridayTarget: data.fridayTarget,
            initialCount: data.initialCount || 0,
            initialDate: data.initialDate || new Date(),
            notes: data.notes,
            logs: [],
        });
    }
    async updateCounter(userId, id, data) {
        const counter = await counterRepository.findById(id);
        if (!counter || counter.user.toString() !== userId) {
            throw { status: 404, message: 'Counter not found' };
        }
        let name = data.name !== undefined ? data.name : counter.name;
        let surahNumber = data.surahNumber !== undefined ? data.surahNumber : counter.surahNumber;
        if (data.surahNumber !== undefined && data.surahNumber !== counter.surahNumber) {
            if (data.surahNumber) {
                const surah = SURAHS.find(s => s.number === data.surahNumber);
                if (!surah) {
                    throw { status: 400, message: 'Invalid Surah number' };
                }
                name = `Surah ${surah.transliteration}`;
            }
            else {
                // Reset surahNumber if it was removed
                surahNumber = undefined;
            }
        }
        return counterRepository.update(id, {
            name,
            surahNumber,
            fromAyah: data.fromAyah !== undefined ? data.fromAyah : counter.fromAyah,
            toAyah: data.toAyah !== undefined ? data.toAyah : counter.toAyah,
            dailyTarget: data.dailyTarget !== undefined ? data.dailyTarget : counter.dailyTarget,
            fridayTarget: data.fridayTarget !== undefined ? data.fridayTarget : counter.fridayTarget,
            initialCount: data.initialCount !== undefined ? data.initialCount : counter.initialCount,
            initialDate: data.initialDate !== undefined ? data.initialDate : counter.initialDate,
            notes: data.notes !== undefined ? data.notes : counter.notes,
        });
    }
    async deleteCounter(userId, id) {
        const counter = await counterRepository.findById(id);
        if (!counter || counter.user.toString() !== userId) {
            throw { status: 404, message: 'Counter not found' };
        }
        return counterRepository.delete(id);
    }
    async addLog(userId, id, data) {
        const counter = await counterRepository.findById(id);
        if (!counter || counter.user.toString() !== userId) {
            throw { status: 404, message: 'Counter not found' };
        }
        if (data.count === undefined || data.count <= 0) {
            throw { status: 400, message: 'Logged count must be greater than 0' };
        }
        const log = {
            count: data.count,
            date: data.date || new Date(),
            notes: data.notes,
        };
        return counterRepository.addLog(id, log);
    }
    async deleteLog(userId, id, logId) {
        const counter = await counterRepository.findById(id);
        if (!counter || counter.user.toString() !== userId) {
            throw { status: 404, message: 'Counter not found' };
        }
        return counterRepository.deleteLog(id, logId);
    }
}
export const counterService = new CounterService();
