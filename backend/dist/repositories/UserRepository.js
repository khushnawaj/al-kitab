import { User } from '../models/User.js';
export class UserRepository {
    async findByEmail(email) {
        return User.findOne({ email });
    }
    async findById(id) {
        return User.findById(id);
    }
    async create(userData) {
        const user = new User(userData);
        return user.save();
    }
    async update(id, updateData) {
        return User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    }
    async delete(id) {
        return User.findByIdAndDelete(id);
    }
}
export const userRepository = new UserRepository();
