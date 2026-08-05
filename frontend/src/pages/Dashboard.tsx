import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { statisticsApi } from '../services/statistics.js';
import type { StatisticsData } from '../services/statistics.js';
import { recitationApi } from '../services/recitations.js';
import type { RecitationRecord } from '../services/recitations.js';
import { counterApi } from '../services/counters.js';
import type { CounterRecord } from '../services/counters.js';
import { useAuth } from '../contexts/AuthContext.js';
import { useLanguage } from '../contexts/LanguageContext.js';
import { EmptyState } from '../components/EmptyState.js';
import {
  NotebookPen,
  Plus,
  Trash2,
  ChevronLeft,
  Bookmark,
  BookMarked,
  Sparkles,
  BookOpenCheck,
  CalendarDays,
  History,
  User,
  ArrowUpRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Selected Register (Notebook Detail page)
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);

  // Manual entry states in notebook view
  const [manualCount, setManualCount] = useState<number>(1);
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState<string>('Subah');
  const [manualNote, setManualNote] = useState<string>('');

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery<StatisticsData>({
    queryKey: ['statistics'],
    queryFn: statisticsApi.getStatistics,
    refetchInterval: 8000
  });

  const { data: recentData, isLoading: recentLoading } = useQuery<{ recitations: RecitationRecord[] }>({
    queryKey: ['recentRecitations'],
    queryFn: () => recitationApi.getRecitations({ page: 1, limit: 5 }),
  });

  const { data: counters = [], isLoading: countersLoading } = useQuery<CounterRecord[]>({
    queryKey: ['counters'],
    queryFn: counterApi.getCounters
  });

  // Mutations
  const incrementCounterMutation = useMutation({
    mutationFn: ({ counterId, count, notes }: { counterId: string; count: number; notes?: string }) =>
      counterApi.addLog(counterId, {
        count,
        date: new Date().toISOString().split('T')[0],
        notes: notes || 'Quick register entry'
      }),
    onSuccess: (updatedCounter) => {
      queryClient.invalidateQueries({ queryKey: ['counters'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      toast.success(`Logged +${incrementCounterMutation.variables?.count} for ${updatedCounter.name}!`);
    },
    onError: () => {
      toast.error('Failed to update count.');
    }
  });

  const addManualEntryMutation = useMutation({
    mutationFn: ({ counterId, count, date, notes }: { counterId: string; count: number; date: string; notes?: string }) =>
      counterApi.addLog(counterId, { count, date, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counters'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      toast.success(t('toast.saveSuccess'));
      setManualCount(1);
      setManualNote('');
    },
    onError: () => {
      toast.error(t('toast.errorSomething'));
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: ({ counterId, logId }: { counterId: string; logId: string }) =>
      counterApi.deleteLog(counterId, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counters'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      toast.success(t('toast.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('toast.errorSomething'));
    }
  });

  const handleIncrementCounter = (counterId: string, count: number) => {
    incrementCounterMutation.mutate({ counterId, count });
  };

  const handleManualEntrySubmit = (e: React.FormEvent, counterId: string) => {
    e.preventDefault();
    const finalNotes = manualNote ? `${manualTime} • ${manualNote}` : manualTime;
    addManualEntryMutation.mutate({
      counterId,
      count: manualCount,
      date: manualDate,
      notes: finalNotes
    });
  };

  const handleDeleteLogEntry = (counterId: string, logId: string) => {
    if (confirm(t('counter.deleteLogConfirm'))) {
      deleteEntryMutation.mutate({ counterId, logId });
    }
  };

  if (statsLoading || recentLoading || countersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 border-r-amber-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          <div className="absolute inset-0 flex items-center justify-center text-lg font-serif">ك</div>
        </div>
        <p className="text-sm font-normal text-amber-700 dark:text-amber-400">Loading your Quran practice stats...</p>
      </div>
    );
  }

  // Calculate statistics across registers and recitations
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Helper to compute stats for a register
  const getRegisterStats = (counter: CounterRecord) => {
    const initial = counter.initialCount || 0;
    const logs = counter.logs || [];
    const total = initial + logs.reduce((sum, log) => sum + log.count, 0);

    let today = 0;
    let week = 0;
    let month = 0;

    logs.forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= startOfToday) {
        today += log.count;
      }
      if (logDate >= sevenDaysAgo) {
        week += log.count;
      }
      if (logDate >= startOfMonth) {
        month += log.count;
      }
    });

    return { total, today, week, month };
  };

  // Global totals (Register counts + direct recitation records)
  let globalToday = stats?.todayCount || 0;
  let globalWeekly = stats?.weeklyCount || 0;
  let globalMonthly = stats?.monthlyCount || 0;
  let globalLifetime = stats?.totalAyahs || 0;

  counters.forEach(counter => {
    const registerStats = getRegisterStats(counter);
    globalToday += registerStats.today;
    globalWeekly += registerStats.week;
    globalMonthly += registerStats.month;
    globalLifetime += registerStats.total;
  });

  // Recent Entries List
  const recentEntriesList: { id: string; name: string; date: string; count: number; type: 'recitation' | 'register'; notes?: string }[] = [];
  recentData?.recitations.forEach(r => {
    recentEntriesList.push({
      id: r._id,
      name: r.surahName,
      date: r.date,
      count: r.ayahCount,
      type: 'recitation',
      notes: r.notes || (r.type === 'entire' ? 'Entire Surah' : `Ayahs ${r.fromAyah}-${r.toAyah}`)
    });
  });
  counters.forEach(counter => {
    counter.logs.forEach(log => {
      recentEntriesList.push({
        id: log._id,
        name: counter.name,
        date: log.date,
        count: log.count,
        type: 'register',
        notes: log.notes
      });
    });
  });
  const sortedRecentEntries = recentEntriesList
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Selected Register Notebook Detail View
  const selectedRegister = counters.find(c => c._id === selectedRegisterId);
  if (selectedRegisterId && selectedRegister) {
    const sortedLogs = [...selectedRegister.logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const notebookRows: { dateStr: string; type: string; countStr: string; runningTotal: number; notes?: string; originalLogId?: string }[] = [];

    let currentRunningTotal = selectedRegister.initialCount;
    notebookRows.push({
      dateStr: new Date(selectedRegister.initialDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      type: 'Initial Count',
      countStr: String(selectedRegister.initialCount),
      runningTotal: currentRunningTotal,
      notes: selectedRegister.notes || 'Register initialized'
    });

    sortedLogs.forEach(log => {
      currentRunningTotal += log.count;
      notebookRows.push({
        dateStr: new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        type: 'Logged Entry',
        countStr: `+${log.count}`,
        runningTotal: currentRunningTotal,
        notes: log.notes,
        originalLogId: log._id
      });
    });

    const regStats = getRegisterStats(selectedRegister);

    return (
      <div className="space-y-6 page-enter text-left font-normal">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedRegisterId(null)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </button>

          <h2 className="text-base font-normal text-slate-800 dark:text-white flex items-center space-x-2 font-outfit">
            <NotebookPen className="w-4 h-4 text-amber-600" />
            <span>{selectedRegister.name} Register</span>
          </h2>
        </div>

        {/* Form to Add Entry */}
        <form onSubmit={(e) => handleManualEntrySubmit(e, selectedRegister._id)} className="dashboard-card p-5 space-y-4 text-left">
          <h4 className="font-normal text-xs text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 font-outfit">
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Log Recitation for {selectedRegister.name}</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-4xs font-normal text-slate-400 uppercase tracking-widest mb-1">Count / Ayahs</label>
              <input
                type="number"
                min="1"
                required
                value={manualCount}
                onChange={e => setManualCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 font-normal focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-4xs font-normal text-slate-400 uppercase tracking-widest mb-1">Date</label>
              <input
                type="date"
                required
                value={manualDate}
                onChange={e => setManualDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 font-normal focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-4xs font-normal text-slate-400 uppercase tracking-widest mb-1">Time of Day</label>
              <select
                value={manualTime}
                onChange={e => setManualTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 font-normal focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Subah">Morning (Fajr)</option>
                <option value="Dopehar">Noon (Dhuhr)</option>
                <option value="Asar Ke Baad">Afternoon (Asr)</option>
                <option value="Maghrib Ke Baad">Evening (Maghrib)</option>
                <option value="Isha Ke Baad">Night (Isha)</option>
                <option value="Raat Ko">Late Night</option>
              </select>
            </div>
            <div>
              <label className="block text-4xs font-normal text-slate-400 uppercase tracking-widest mb-1">Notes</label>
              <input
                type="text"
                placeholder="e.g. Surah Yaseen Tilawat"
                value={manualNote}
                onChange={e => setManualNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 font-normal focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addManualEntryMutation.isPending}
            className="w-full py-2 rounded-xl bg-amber-800 text-white hover:bg-amber-900 text-xs font-normal transition-colors"
          >
            {addManualEntryMutation.isPending ? 'Saving...' : 'Save Recitation Entry'}
          </button>
        </form>

        {/* Notebook Entry List */}
        <div className="dashboard-card p-5 relative overflow-hidden text-left min-h-[300px]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-normal text-slate-800 dark:text-slate-100 flex items-center space-x-2 font-outfit">
                <BookMarked className="w-4 h-4 text-amber-600" />
                <span>{selectedRegister.name} Recitation Log</span>
              </h3>
            </div>
            <div className="text-right">
              <p className="text-4xs text-slate-400 uppercase font-normal">Total Till Now</p>
              <p className="text-xl font-light text-emerald-600 dark:text-emerald-400">{regStats.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-1">
            {notebookRows.map((row, idx) => (
              <div key={idx} className="border-b border-slate-100 dark:border-slate-800/60 py-3 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-3">
                  <span className="text-3xs font-normal text-slate-400 w-16">{row.dateStr}</span>
                  <div>
                    <p className="font-normal text-slate-700 dark:text-slate-200">{row.type}</p>
                    {row.notes && <p className="text-4xs text-slate-400 italic">“{row.notes}”</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-normal text-slate-600 dark:text-slate-300">{row.countStr}</span>
                  <span className="font-normal text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">{row.runningTotal}</span>
                  {row.originalLogId && (
                    <button
                      onClick={() => handleDeleteLogEntry(selectedRegister._id, row.originalLogId!)}
                      className="p-1 hover:text-red-500 text-slate-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculations for progress & ratio metrics
  const completion = stats?.goals?.dailyCompletion !== undefined ? stats.goals.dailyCompletion : Math.min(100, Math.round((globalToday / (stats?.goals?.daily || 10)) * 100));
  const weeklyTarget = (stats?.goals?.daily || 10) * 7;
  const weeklyCompletion = Math.min(100, Math.round((globalWeekly / weeklyTarget) * 100));
  const monthlyTarget = (stats?.goals?.daily || 10) * 30;
  const monthlyCompletion = Math.min(100, Math.round((globalMonthly / monthlyTarget) * 100));

  const last7DaysData = stats?.charts?.last7Days || [
    { label: 'S', count: 0, date: '' },
    { label: 'M', count: 0, date: '' },
    { label: 'T', count: 0, date: '' },
    { label: 'W', count: 0, date: '' },
    { label: 'T', count: 0, date: '' },
    { label: 'F', count: 0, date: '' },
    { label: 'S', count: 0, date: '' }
  ];
  const maxDayCount = Math.max(...last7DaysData.map(d => d.count), 1);

  const directRecitationCount = recentData?.recitations?.reduce((sum, r) => sum + r.ayahCount, 0) || 0;
  const registerLogCount = globalLifetime - directRecitationCount;
  const totalRatio = Math.max(1, globalLifetime);
  const registerRatioPercent = Math.min(100, Math.max(15, Math.round((registerLogCount / totalRatio) * 100)));
  const directRatioPercent = 100 - registerRatioPercent;

  return (
    <div className="space-y-4 page-enter text-left font-normal max-w-6xl mx-auto">
      
      {/* ── 1. HEADER & GREETING BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-4xs font-normal text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Overview
          </p>
          <h1 className="font-outfit text-2xl sm:text-3xl font-light text-slate-800 dark:text-slate-100 tracking-tight">
            Welcome in, <span className="font-normal text-amber-800 dark:text-amber-400 capitalize">{user?.name || 'Reciter'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/add"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-outfit text-xs font-normal text-white bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Recitation</span>
          </Link>
        </div>
      </div>

      {/* ── 2. TOP METRICS & PROGRESS SUMMARY BAR ── */}
      <div className="dashboard-card p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Progress Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
          {/* Daily Goal */}
          <div className="space-y-1">
            <div className="flex justify-between text-4xs font-normal text-slate-400 dark:text-slate-400">
              <span>Daily Goal</span>
              <span className="font-normal text-slate-600 dark:text-slate-300">{completion}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-amber-100/60 dark:bg-slate-800/80 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 bg-amber-800 dark:bg-amber-600"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-4xs font-normal text-slate-400 dark:text-slate-400">
              <span>Weekly Progress</span>
              <span className="font-normal text-slate-600 dark:text-slate-300">{weeklyCompletion}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-amber-100/60 dark:bg-slate-800/80 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 bg-amber-800 dark:bg-amber-600"
                style={{ width: `${weeklyCompletion}%` }}
              />
            </div>
          </div>

          {/* Monthly Target */}
          <div className="space-y-1">
            <div className="flex justify-between text-4xs font-normal text-slate-400 dark:text-slate-400">
              <span>Monthly Target</span>
              <span className="font-normal text-slate-600 dark:text-slate-300">{monthlyCompletion}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-amber-100/60 dark:bg-slate-800/80 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 bg-amber-800 dark:bg-amber-600"
                style={{ width: `${monthlyCompletion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Quick Stat Badges */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-800 pt-3 md:pt-0 md:pl-5 w-full md:w-auto justify-around">
          <div className="text-center">
            <span className="font-outfit text-xl font-light text-slate-800 dark:text-slate-100">
              {globalLifetime.toLocaleString()}
            </span>
            <p className="text-4xs font-normal text-slate-400">Total Ayahs</p>
          </div>
          <div className="text-center">
            <span className="font-outfit text-xl font-light text-slate-800 dark:text-slate-100">
              {stats?.currentStreak || 1}
            </span>
            <p className="text-4xs font-normal text-slate-400">Day Streak</p>
          </div>
          <div className="text-center">
            <span className="font-outfit text-xl font-light text-slate-800 dark:text-slate-100">
              {counters.length}
            </span>
            <p className="text-4xs font-normal text-slate-400">Registers</p>
          </div>
        </div>
      </div>

      {/* ── 3. MIDDLE 4-CARD BENTO GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: User Profile Widget */}
        <div className="dashboard-card p-3.5 flex flex-col justify-between items-center text-center space-y-3">
          <div className="w-full flex items-center justify-start">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-amber-800/30 shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full border border-amber-800/30 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 flex items-center justify-center font-normal text-xs font-outfit shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'K'}
              </div>
            )}
            <div className="ml-2.5 text-left min-w-0">
              <h3 className="font-outfit font-normal text-xs text-slate-800 dark:text-slate-100 truncate">
                {user?.name || 'Reciter'}
              </h3>
              <span className="inline-block px-1.5 py-0.5 rounded-full text-4xs font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                {user?.role === 'admin' ? 'Master Reciter' : 'Dedicated Reciter'}
              </span>
            </div>
          </div>

          {/* SVG Progress Ring */}
          <div className="relative w-20 h-20 flex items-center justify-center my-0.5">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="30" fill="transparent" stroke="currentColor" strokeWidth="3.5" className="text-slate-100 dark:text-slate-800" />
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="transparent"
                stroke="#d97706"
                strokeWidth="3.5"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={2 * Math.PI * 30 - (Math.min(100, completion) / 100) * (2 * Math.PI * 30)}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-outfit text-sm font-light text-slate-800 dark:text-slate-100">{completion}%</span>
            </div>
          </div>

          <div>
            <p className="text-4xs font-normal text-slate-400">Total Recited</p>
            <p className="font-outfit text-base font-light text-slate-800 dark:text-slate-100">
              {globalLifetime.toLocaleString()}
            </p>
          </div>

          <Link
            to="/profile"
            className="w-full py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-outfit text-xs font-normal text-slate-600 dark:text-slate-300 transition-colors text-center"
          >
            View Profile
          </Link>
        </div>

        {/* Card 2: Weekly Recitation Activity Widget */}
        <div className="dashboard-card p-3.5 flex flex-col justify-between text-left space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-outfit font-normal text-xs text-slate-800 dark:text-slate-100">
                Activity
              </h3>
              <p className="text-4xs text-slate-400 font-normal">Ayahs read this week</p>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-1.5 h-16 pt-1">
            {last7DaysData.map((d, i) => {
              const h = Math.max(15, Math.round((d.count / maxDayCount) * 100));
              return (
                <div key={i} className="flex flex-col items-center flex-1 space-y-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-full h-12 flex items-end p-0.5">
                    <div
                      className="w-full rounded-full transition-all duration-500 bg-amber-800 dark:bg-amber-600"
                      style={{ height: `${h}%` }}
                      title={`${d.count} Ayahs`}
                    />
                  </div>
                  <span className="text-4xs font-normal text-slate-400">{d.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-2xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-4xs font-normal text-slate-400">Total Ayahs</p>
              <p className="font-outfit text-xs font-normal text-slate-800 dark:text-slate-100">
                {globalWeekly.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xs font-normal text-slate-400">Streak</p>
              <p className="font-outfit text-xs font-normal text-emerald-600 dark:text-emerald-400">
                {stats?.currentStreak || 1} Days
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Recitation Ratio Widget */}
        <div className="dashboard-card p-3.5 flex flex-col justify-between text-left space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-outfit font-normal text-xs text-slate-800 dark:text-slate-100">
              Reading Ratio
            </h3>
          </div>

          {/* Donut Visual */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center my-0.5">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="30" fill="transparent" stroke="#169b5c" strokeWidth="4" />
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="transparent"
                stroke="#d97706"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={(directRatioPercent / 100) * (2 * Math.PI * 30)}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-outfit text-sm font-light text-slate-800 dark:text-slate-100">
                {registerRatioPercent}%
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-0.5 text-4xs font-normal">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="text-slate-500 dark:text-slate-400">Registers</span>
              </div>
              <span className="font-normal text-slate-700 dark:text-slate-300">{registerRatioPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span className="text-slate-500 dark:text-slate-400">Tilawat</span>
              </div>
              <span className="font-normal text-slate-700 dark:text-slate-300">{directRatioPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Recent Recitations Widget */}
        <div className="dashboard-card p-3.5 flex flex-col justify-between text-left space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-outfit font-normal text-xs text-slate-800 dark:text-slate-100">
              Recent Recitations
            </h3>
            <span className="px-1.5 py-0.5 rounded-full text-4xs font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
              {sortedRecentEntries.length} items
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {sortedRecentEntries.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center italic font-normal">No recitations logged</p>
            ) : (
              sortedRecentEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Bookmark className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-outfit text-xs font-normal text-slate-700 dark:text-slate-200 truncate">
                      {entry.name}
                    </p>
                    <p className="text-4xs font-normal text-slate-400 truncate">
                      {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-4xs font-normal text-amber-800 dark:text-amber-400">
                    +{entry.count}
                  </span>
                </div>
              ))
            )}
          </div>

          <Link
            to="/history"
            className="w-full py-1.5 rounded-xl bg-amber-100/60 hover:bg-amber-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 font-outfit text-xs font-normal text-amber-900 dark:text-amber-200 transition-colors text-center"
          >
            View All Recitations
          </Link>
        </div>

      </div>

      {/* ── 4. BOTTOM ROW GRID (QUICK ACTIONS & ACTIVE REGISTERS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        
        {/* Quick Actions Card */}
        <div className="dashboard-card p-3.5 space-y-3 text-left">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <h3 className="font-outfit font-normal text-xs text-slate-800 dark:text-slate-100">
              Quick Actions
            </h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              { label: 'Add Tilawat', path: '/add', icon: Plus, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' },
              { label: 'Registers', path: '/counters', icon: BookOpenCheck, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' },
              { label: 'Calendar', path: '/calendar', icon: CalendarDays, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
              { label: 'History', path: '/history', icon: History, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' },
              { label: 'Profile', path: '/profile', icon: User, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' },
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all bg-white/40 dark:bg-slate-900/30 group"
                >
                  <div className={`w-7 h-7 rounded-lg ${action.color} flex items-center justify-center mb-1.5`}>
                    <ActionIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-outfit text-4xs font-normal text-slate-600 dark:text-slate-300">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Active Registers Quick Log Card */}
        <div className="dashboard-card p-3.5 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpenCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <h3 className="font-outfit font-normal text-xs text-slate-800 dark:text-slate-100">
                Active Registers & Dhikr
              </h3>
            </div>
            <Link to="/counters" className="text-4xs font-normal text-slate-400 hover:text-slate-600">
              See all &gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {counters.length === 0 ? (
              <EmptyState
                title="No active registers"
                description="Start a Surah or Dhikr register to log daily progress."
                action={
                  <Link to="/counters" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-normal bg-amber-800 text-white">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Register</span>
                  </Link>
                }
              />
            ) : (
              counters.slice(0, 4).map((counter) => {
                const regStats = getRegisterStats(counter);
                return (
                  <div
                    key={counter._id}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-slate-900/30 hover:border-slate-300 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-outfit font-normal text-xs text-slate-800 dark:text-slate-200 truncate">
                        {counter.name}
                      </h4>
                      <p className="text-4xs text-slate-400 font-normal mt-0.5">
                        Total: {regStats.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        onClick={() => setSelectedRegisterId(counter._id)}
                        className="px-2 py-1 rounded-lg text-4xs font-normal bg-amber-100/60 dark:bg-slate-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleIncrementCounter(counter._id, 1)}
                        disabled={incrementCounterMutation.isPending}
                        className="px-2 py-1 rounded-lg text-4xs font-normal bg-amber-800 text-white hover:bg-amber-900 transition-colors"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
