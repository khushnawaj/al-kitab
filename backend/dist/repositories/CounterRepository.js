import { Counter } from '../models/Counter.js';
export class CounterRepository {
    async findById(id) {
        return Counter.findById(id);
    }
    async findByUserId(userId) {
        // Sort by name or creation date. Let's sort alphabetically by name.
        return Counter.find({ user: userId }).sort({ name: 1 });
    }
    async create(counterData) {
        const counter = new Counter(counterData);
        return counter.save();
    }
    async update(id, updateData) {
        return Counter.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    }
    async delete(id) {
        return Counter.findByIdAndDelete(id);
    }
    async deleteAllByUserId(userId) {
        return Counter.deleteMany({ user: userId });
    }
    async addLog(id, logData) {
        return Counter.findByIdAndUpdate(id, { $push: { logs: logData } }, { new: true });
    }
    async deleteLog(id, logId) {
        return Counter.findByIdAndUpdate(id, { $pull: { logs: { _id: logId } } }, { new: true });
    }
}
export const counterRepository = new CounterRepository();
