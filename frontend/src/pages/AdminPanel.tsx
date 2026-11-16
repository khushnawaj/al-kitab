import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.js';
import { adminApi } from '../services/admin.js';
import {
  Shield,
  ShieldAlert,
  Users,
  BookOpen,
  Trash2,
  Calendar,
  UserCheck,
  UserX,
  Search,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const isAdmin = user?.role === 'admin';

  // React hooks must execute unconditionally on every render
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminApi.getAllUsers,
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success(data.message || 'User role updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success(data.message || 'User deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  });

  // Guard view for non-admin users
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            You do not have the required administrator privileges to view this control panel.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  const handleRoleToggle = (targetUser: any) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    
    // Prevent self-demotion to avoid losing admin lock
    if (targetUser._id === user?.id) {
      toast.error('You cannot demote yourself from administrator status.');
      return;
    }

    updateRoleMutation.mutate({ id: targetUser._id, role: newRole });
  };

  const handleDeleteUser = (targetUser: any) => {
    if (targetUser._id === user?.id) {
      toast.error('You cannot delete your own admin account from here.');
      return;
    }

    const confirmed = window.confirm(
      `Are you absolutely sure you want to delete user "${targetUser.name}"? This will permanently erase their recitation registry history, counters, and goals.`
    );
    
    if (confirmed) {
      deleteUserMutation.mutate(targetUser._id);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 font-normal text-left">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-normal font-outfit text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-slate-400 text-xs font-normal">
            Manage users, permissions, and database health
          </p>
        </div>
      </div>

      {/* Stats Quick Counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="dashboard-card p-3 text-left space-y-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
          <p className="text-4xs font-normal text-slate-400 uppercase tracking-wider">Total Users</p>
          <p className="text-sm font-light font-outfit text-slate-800 dark:text-slate-100">{users.length}</p>
        </div>

        <div className="dashboard-card p-3 text-left space-y-1">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <p className="text-4xs font-normal text-slate-400 uppercase tracking-wider">Admins</p>
          <p className="text-sm font-light font-outfit text-slate-800 dark:text-slate-100">
            {users.filter((u) => u.role === 'admin').length}
          </p>
        </div>

        <div className="dashboard-card p-3 text-left space-y-1">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <p className="text-4xs font-normal text-slate-400 uppercase tracking-wider">Total Ayahs</p>
          <p className="text-sm font-light font-outfit text-slate-800 dark:text-slate-100">
            {users.reduce((sum, u) => sum + (u.totalAyahs || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="dashboard-card p-3 text-left">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Users Card List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-normal">Loading users registry...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 font-normal">No users found matching query.</div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((targetUser) => (
            <div
              key={targetUser._id}
              className="dashboard-card p-3.5 text-left space-y-3 relative overflow-hidden font-normal"
            >
              {/* Top User Info header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 flex items-center justify-center font-normal text-xs font-outfit shrink-0">
                    {targetUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-normal font-outfit text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{targetUser.name}</span>
                      {targetUser.role === 'admin' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-4xs font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-4xs font-normal bg-slate-100 dark:bg-slate-800 text-slate-500">
                          User
                        </span>
                      )}
                    </h3>
                    <p className="text-4xs text-slate-400 font-normal mt-0.5">{targetUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Stats & Metadata */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-4xs font-normal">
                <div className="space-y-0.5">
                  <span className="text-slate-400 uppercase tracking-wider block">Recitations Count</span>
                  <strong className="text-slate-700 dark:text-slate-300 font-normal">{targetUser.recitationsCount || 0} registers</strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 uppercase tracking-wider block">Total Recited</span>
                  <strong className="text-slate-700 dark:text-slate-300 font-normal">{targetUser.totalAyahs || 0} Ayahs</strong>
                </div>
              </div>

              {/* Joined Date */}
              <div className="flex items-center justify-between text-4xs text-slate-400 font-normal">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(targetUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>

                {/* Actions row */}
                <div className="flex items-center space-x-1">
                  {/* Toggle Admin Status */}
                  <button
                    onClick={() => handleRoleToggle(targetUser)}
                    disabled={targetUser._id === user?.id || updateRoleMutation.isPending}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-40"
                    title={targetUser.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                  >
                    {targetUser.role === 'admin' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>

                  {/* Delete user */}
                  <button
                    onClick={() => handleDeleteUser(targetUser)}
                    disabled={targetUser._id === user?.id || deleteUserMutation.isPending}
                    className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer disabled:opacity-40"
                    title="Delete User Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
