import { Counter, ICounter, ICounterLog } from '../models/Counter.js';

export class CounterRepository {
  async findById(id: string): Promise<ICounter | null> {
    return Counter.findById(id);
  }

  async findByUserId(userId: string): Promise<ICounter[]> {
    // Sort by name or creation date. Let's sort alphabetically by name.
    return Counter.find({ user: userId }).sort({ name: 1 });
  }

  async create(counterData: Partial<ICounter>): Promise<ICounter> {
    const counter = new Counter(counterData);
    return counter.save();
  }

  async update(id: string, updateData: Partial<ICounter>): Promise<ICounter | null> {
    return Counter.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  async delete(id: string): Promise<ICounter | null> {
    return Counter.findByIdAndDelete(id);
  }

  async deleteAllByUserId(userId: string): Promise<any> {
    return Counter.deleteMany({ user: userId });
  }

  async addLog(id: string, logData: ICounterLog): Promise<ICounter | null> {
    return Counter.findByIdAndUpdate(
      id,
      { $push: { logs: logData } },
      { new: true }
    );
  }

  async deleteLog(id: string, logId: string): Promise<ICounter | null> {
    return Counter.findByIdAndUpdate(
      id,
      { $pull: { logs: { _id: logId } } },
      { new: true }
    );
  }
}

export const counterRepository = new CounterRepository();
