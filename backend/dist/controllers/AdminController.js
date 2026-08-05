import { User } from '../models/User.js';
import { Recitation } from '../models/Recitation.js';
import { Counter } from '../models/Counter.js';
import { Goal } from '../models/Goal.js';
export class AdminController {
    async getAllUsers(req, res) {
        try {
            const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 }).lean();
            // Enrich users with basic stats
            const enrichedUsers = await Promise.all(users.map(async (u) => {
                const recitations = await Recitation.find({ user: u._id });
                const totalAyahs = recitations.reduce((sum, r) => sum + r.ayahCount, 0);
                return {
                    ...u,
                    recitationsCount: recitations.length,
                    totalAyahs
                };
            }));
            res.status(200).json({
                success: true,
                data: enrichedUsers
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve users'
            });
        }
    }
    async updateUserRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            if (!['user', 'admin'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role' });
            }
            const updatedUser = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true });
            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.status(200).json({
                success: true,
                message: 'User role updated successfully',
                data: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role
                }
            });
        }
        catch (error) {
            res.status(505).json({
                success: false,
                message: 'Failed to update user role'
            });
        }
    }
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);
            if (!deletedUser) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            // Clean up user data
            await Recitation.deleteMany({ user: id });
            await Counter.deleteMany({ user: id });
            await Goal.deleteMany({ user: id });
            res.status(200).json({
                success: true,
                message: 'User and all associated data deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete user'
            });
        }
    }
}
export const adminController = new AdminController();
