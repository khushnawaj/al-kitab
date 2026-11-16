import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Recitation } from '../models/Recitation.js';
import { Counter } from '../models/Counter.js';
import { Goal } from '../models/Goal.js';
import { RefreshToken } from '../models/RefreshToken.js';

export class AdminController {
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 }).lean();

      // Aggregate user recitation stats in a single query instead of N+1 queries
      const recitationStats = await Recitation.aggregate([
        {
          $group: {
            _id: '$user',
            recitationsCount: { $sum: 1 },
            totalAyahs: { $sum: '$ayahCount' },
          },
        },
      ]);

      const statsMap = new Map<string, { recitationsCount: number; totalAyahs: number }>();
      for (const stat of recitationStats) {
        statsMap.set(stat._id.toString(), {
          recitationsCount: stat.recitationsCount || 0,
          totalAyahs: stat.totalAyahs || 0,
        });
      }

      const enrichedUsers = users.map((u) => {
        const stats = statsMap.get(u._id.toString()) || { recitationsCount: 0, totalAyahs: 0 };
        return {
          ...u,
          recitationsCount: stats.recitationsCount,
          totalAyahs: stats.totalAyahs,
        };
      });

      res.status(200).json({
        success: true,
        data: enrichedUsers,
      });
    } catch (error) {
      console.error('Failed to retrieve users in AdminController:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
      });
    }
  }

  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['user', 'admin'].includes(role)) {
        res.status(400).json({ success: false, message: 'Invalid role. Must be "user" or "admin"' });
        return;
      }

      const updatedUser = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true });
      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      console.error('Failed to update user role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role',
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Comprehensive cascade cleanup: delete recitations, counters, goals, and refresh tokens
      await Promise.all([
        Recitation.deleteMany({ user: id }),
        Counter.deleteMany({ user: id }),
        Goal.deleteMany({ user: id }),
        RefreshToken.deleteMany({ user: id }),
      ]);
      await User.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'User and all associated data deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user and associated data',
      });
    }
  }
}

export const adminController = new AdminController();
