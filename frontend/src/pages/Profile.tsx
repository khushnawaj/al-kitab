import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useLanguage } from '../contexts/LanguageContext.js';
import { statisticsApi } from '../services/statistics.js';
import { recitationApi } from '../services/recitations.js';
import {
  Mail,
  Calendar,
  Shield,
  Flame,
  Award,
  BookOpen,
  Clock,
  ChevronRight,
  TrendingUp,
  Sprout,
  Crown,
  Star,
  Zap,
  Camera,
  Trash2,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AchievementBadge {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  unlocked: boolean;
  color: string;
}

export const Profile: React.FC = () => {
  const { user, updateProfileState } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: statisticsApi.getStatistics
  });

  const { data: recentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['recentRecitations'],
    queryFn: () => recitationApi.getRecitations({ limit: 5 })
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateProfileState({ avatarUrl: result });
      toast.success('Profile picture updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    updateProfileState({ avatarUrl: '' });
    toast.success('Profile picture removed');
  };

  if (!user) {
    return (
      <div className="text-center py-12 font-normal">
        <p className="text-slate-400 text-xs">Please sign in to view your profile.</p>
      </div>
    );
  }

  // Calculate achievements
  const totalAyahs = stats?.totalAyahs || 0;
  const currentStreak = stats?.currentStreak || 0;
  const longestStreak = stats?.longestStreak || 0;
  const averagePerDay = stats?.averagePerDay || 0;

  const badges: AchievementBadge[] = [
    {
      id: 'mubtadi',
      title: 'Al-Mubtadi\'',
      desc: 'Recorded your first Quran recitation entry',
      icon: Sprout,
      unlocked: totalAyahs > 0,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'qari',
      title: 'Al-Qari\'',
      desc: 'Recited more than 100 Ayahs total',
      icon: BookOpen,
      unlocked: totalAyahs >= 100,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'hafiz',
      title: 'Al-Hafiz',
      desc: 'Recited more than 1000 Ayahs total',
      icon: Crown,
      unlocked: totalAyahs >= 1000,
      color: 'from-amber-550/20 to-yellow-500/20 text-amber-600 dark:text-amber-400'
    },
    {
      id: 'mustamirr',
      title: 'Al-Mustamirr',
      desc: 'Achieved a recitation streak of 3 days or more',
      icon: Flame,
      unlocked: longestStreak >= 3,
      color: 'from-orange-500/20 to-red-500/20 text-orange-600 dark:text-orange-400'
    },
    {
      id: 'kamil',
      title: 'Al-Kamil',
      desc: 'Maintained a streak of 7 days or more',
      icon: Star,
      unlocked: longestStreak >= 7,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'nashit',
      title: 'Al-Nashit',
      desc: 'Recorded a daily average of 15+ Ayahs',
      icon: Zap,
      unlocked: averagePerDay >= 15,
      color: 'from-cyan-500/20 to-sky-500/20 text-cyan-600 dark:text-cyan-400'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 font-normal">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start text-left font-normal">
        {/* Left Column: User details & Achievements */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card */}
          <div className="relative overflow-hidden dashboard-card p-5 text-left space-y-4">
            <div className="flex items-center space-x-4">
              {/* Profile Image with Upload Trigger */}
              <div className="relative group shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-300/40 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 flex items-center justify-center font-normal font-outfit text-2xl border-2 border-amber-300/40">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-amber-800 text-white hover:bg-amber-900 shadow-xs transition-transform transform hover:scale-110 cursor-pointer"
                  title="Upload profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-normal font-outfit text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                  <span>{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-4xs font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300/40 uppercase tracking-wide">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-normal flex items-center space-x-1.5 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>
                <p className="text-slate-400 text-4xs font-normal flex items-center space-x-1.5 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
                </p>
              </div>
            </div>

            {/* Profile Picture Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-normal text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer font-outfit"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>Upload Photo</span>
              </button>

              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="py-1.5 px-3 rounded-xl border border-red-200 dark:border-red-900/30 text-xs font-normal text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center cursor-pointer font-outfit"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {user.role === 'admin' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/admin"
                  className="w-full inline-flex items-center justify-between py-1.5 px-3 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-normal transition-all font-outfit shadow-xs"
                >
                  <span className="flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Control Panel</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Digital Achievements / Badges */}
          <div className="dashboard-card p-5 text-left space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-xs flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Islamic Achievements</span>
              </h3>
              <span className="text-4xs font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/40">
                {badges.filter(b => b.unlocked).length}/{badges.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center space-x-3 ${
                    badge.unlocked
                      ? 'bg-amber-50/40 dark:bg-slate-900/30 border-amber-200/50 dark:border-slate-800'
                      : 'bg-slate-50/10 dark:bg-slate-900/5 border-slate-100 dark:border-slate-800 opacity-40 select-none'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${badge.color}`}>
                    {React.createElement(badge.icon, { className: 'w-4 h-4' })}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-normal font-outfit text-slate-800 dark:text-slate-200 truncate">{badge.title}</p>
                    <p className="text-4xs text-slate-400 mt-0.5 leading-tight">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recitation Statistics Overview */}
          <div className="dashboard-card p-5 text-left space-y-4">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-xs flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Recitation Stats</span>
            </h3>

            {statsLoading ? (
              <div className="py-4 text-center text-xs text-slate-400 font-normal">{t('buttons.loading')}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-4xs font-normal text-slate-400 uppercase tracking-wider">Total Ayahs</p>
                    <p className="text-base font-light font-outfit text-slate-800 dark:text-slate-100 mt-0.5">{totalAyahs}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-4xs font-normal text-slate-400 uppercase tracking-wider">Current Streak</p>
                    <p className="text-base font-light font-outfit text-slate-800 dark:text-slate-100 mt-0.5">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-4xs font-normal text-slate-400 uppercase tracking-wider">Longest Streak</p>
                    <p className="text-base font-light font-outfit text-slate-800 dark:text-slate-100 mt-0.5">{longestStreak} {longestStreak === 1 ? 'day' : 'days'}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-4xs font-normal text-slate-400 uppercase tracking-wider">Daily Average</p>
                    <p className="text-base font-light font-outfit text-slate-800 dark:text-slate-100 mt-0.5">{averagePerDay}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Recitation Activity Logs */}
          <div className="dashboard-card p-5 text-left space-y-4 font-normal">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-xs flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Recent Activity Logs</span>
            </h3>

            {historyLoading ? (
              <div className="py-4 text-center text-xs text-slate-400 font-normal">{t('buttons.loading')}</div>
            ) : recentHistory?.recitations?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center font-normal">No recent recitation records found.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentHistory?.recitations?.map((record) => (
                  <div key={record._id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0 font-normal">
                    <div className="space-y-0.5">
                      <p className="text-xs font-normal font-outfit text-slate-800 dark:text-slate-200">
                        {record.surahName}
                      </p>
                      <p className="text-4xs text-slate-400 font-normal">
                        {record.type === 'entire' ? 'Entire Surah' : `Verses ${record.fromAyah}-${record.toAyah}`} • {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-4xs font-normal text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-300/40 font-outfit">
                        +{record.ayahCount} Ayahs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
