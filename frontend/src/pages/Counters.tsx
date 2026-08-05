import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { counterApi } from '../services/counters.js';
import type { CounterRecord } from '../services/counters.js';
import { useLanguage } from '../contexts/LanguageContext.js';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  Edit2, 
  X, 
  Clock,
  BookOpen,
  Award,
  Calculator,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Counters: React.FC = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<CounterRecord | null>(null);
  
  // Form states for Create/Edit Counter
  const [customName, setCustomName] = useState('');
  const [fromAyah, setFromAyah] = useState<number | ''>('');
  const [toAyah, setToAyah] = useState<number | ''>('');
  const [dailyTarget, setDailyTarget] = useState<number | ''>('');
  const [fridayTarget, setFridayTarget] = useState<number | ''>('');
  const [initialCount, setInitialCount] = useState<number>(0);
  const [initialDate, setInitialDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Past History Calculator states
  const [showCalc, setShowCalc] = useState(false);
  const [calcFromDate, setCalcFromDate] = useState('');
  const [calcToDate, setCalcToDate] = useState(new Date().toISOString().split('T')[0]);
  const [calcDailyCount, setCalcDailyCount] = useState<number | ''>('');
  const [calcFridayExtra, setCalcFridayExtra] = useState<number | ''>('');
  const [calcResult, setCalcResult] = useState<{ total: number; days: number; fridays: number } | null>(null);

  // Expanded logs list state per counter ID
  const [expandedLogs, setExpandedLogs] = useState<{ [key: string]: boolean }>({});

  // Inline logging state per counter ID
  const [logCounts, setLogCounts] = useState<{ [key: string]: string }>({});
  const [logNotes, setLogNotes] = useState<{ [key: string]: string }>({});
  const [logDates, setLogDates] = useState<{ [key: string]: string }>({});

  // Fetch Counters
  const { data: counters = [], isLoading } = useQuery<CounterRecord[]>({
    queryKey: ['counters'],
    queryFn: counterApi.getCounters
  });

  // Create Counter Mutation
  const createMutation = useMutation({
    mutationFn: counterApi.createCounter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counters'] });
      toast.success('New counter created successfully');
      closeCreateModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create counter');
    }
  });

  // Update Counter Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => counterApi.updateCounter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counters'] });
      toast.success('Counter updated successfully');
      closeCreateModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update counter');
    }
  });

  // Delete Counter Mutation
  const deleteMutation = useMutation({
    mutationFn: counterApi.deleteCounter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counters'] });
      toast.success('Counter deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete counter');
    }
  });

  // Add Log Mutation
  const addLogMutation = useMutation({
    mutationFn: ({ counterId, data }: { counterId: string; data: any }) => counterApi.addLog(counterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counters'] });
      toast.success('Recitation logged successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to log recitation');
    }
  });

  // Delete Log Mutation
  const deleteLogMutation = useMutation({
    mutationFn: ({ counterId, logId }: { counterId: string; logId: string }) => counterApi.deleteLog(counterId, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counters'] });
      toast.success('Log entry deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete log entry');
    }
  });





  const openCreateModal = (counter?: CounterRecord) => {
    if (counter) {
      setEditingCounter(counter);
      setCustomName(counter.name);
      setFromAyah(counter.fromAyah !== undefined ? counter.fromAyah : '');
      setToAyah(counter.toAyah !== undefined ? counter.toAyah : '');
      setDailyTarget(counter.dailyTarget !== undefined ? counter.dailyTarget : '');
      setFridayTarget(counter.fridayTarget !== undefined ? counter.fridayTarget : '');
      setInitialCount(counter.initialCount);
      setInitialDate(new Date(counter.initialDate).toISOString().split('T')[0]);
      setNotes(counter.notes || '');
    } else {
      setEditingCounter(null);
      setCustomName('');
      setFromAyah('');
      setToAyah('');
      setDailyTarget('');
      setFridayTarget('');
      setInitialCount(0);
      setInitialDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      // Reset calculator
      setShowCalc(false);
      setCalcFromDate('');
      setCalcToDate(new Date().toISOString().split('T')[0]);
      setCalcDailyCount('');
      setCalcFridayExtra('');
      setCalcResult(null);
      setShowMoreDetails(false);
    }
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setEditingCounter(null);
  };

  const handleSubmitCounter = (e: React.FormEvent) => {
    e.preventDefault();
    
    const name = customName.trim();
    if (!name) {
      toast.error('Please enter a name for the counter');
      return;
    }

    const payload = {
      name,
      fromAyah: fromAyah === '' ? undefined : Number(fromAyah),
      toAyah: toAyah === '' ? undefined : Number(toAyah),
      dailyTarget: dailyTarget === '' ? undefined : Number(dailyTarget),
      fridayTarget: fridayTarget === '' ? undefined : Number(fridayTarget),
      initialCount,
      initialDate,
      notes
    };

    if (editingCounter) {
      updateMutation.mutate({ id: editingCounter._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAddLogInline = (counterId: string) => {
    const rawCount = logCounts[counterId];
    const count = parseInt(rawCount);
    if (!rawCount || isNaN(count) || count <= 0) {
      toast.error('Please enter a valid count greater than 0');
      return;
    }

    const date = logDates[counterId] || new Date().toISOString().split('T')[0];
    const notesStr = logNotes[counterId] || '';

    addLogMutation.mutate({
      counterId,
      data: { count, date, notes: notesStr }
    });

    // Clear inputs
    setLogCounts(prev => ({ ...prev, [counterId]: '' }));
    setLogNotes(prev => ({ ...prev, [counterId]: '' }));
  };

  const getCounterTotal = (counter: CounterRecord) => {
    const logsTotal = (counter.logs || []).reduce((sum, log) => sum + log.count, 0);
    return counter.initialCount + logsTotal;
  };

  // Past History Calculator
  const handleCalculateHistory = () => {
    if (!calcFromDate || !calcToDate) return;
    const from = new Date(calcFromDate);
    const to = new Date(calcToDate);
    if (from > to) {
      toast.error('Start date must be before end date');
      return;
    }
    const daily = typeof calcDailyCount === 'number' ? calcDailyCount : 0;
    const fridayExtra = typeof calcFridayExtra === 'number' ? calcFridayExtra : 0;

    let days = 0;
    let fridays = 0;
    const cursor = new Date(from);
    while (cursor <= to) {
      days++;
      if (cursor.getDay() === 5) fridays++; // 5 = Friday
      cursor.setDate(cursor.getDate() + 1);
    }
    const total = days * daily + fridays * fridayExtra;
    setCalcResult({ total, days, fridays });
  };

  const toggleLogsExpanded = (counterId: string) => {
    setExpandedLogs(prev => ({ ...prev, [counterId]: !prev[counterId] }));
  };



  return (
    <div className="space-y-6 max-w-4xl mx-auto page-enter text-left">
      {/* Create Button only */}
      <div className="flex justify-end">
        <button
          onClick={() => openCreateModal()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-normal transition-all shadow-xs text-white bg-amber-800 hover:bg-amber-900 cursor-pointer font-outfit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('counter.newCounter')}</span>
        </button>
      </div>

      {/* Active Registers List */}
      <div className="space-y-4">
        <h2 className="font-outfit font-normal text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Active Registers</span>
        </h2>

        {isLoading ? (
          <div className="text-center py-8 text-xs font-normal text-slate-400">Loading registers...</div>
        ) : counters.length === 0 ? (
          <div className="dashboard-card p-10 text-center text-slate-400">
            <p className="text-xs font-normal">No active recitation registers found. Set one up above to start logging!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {counters.map((counter) => {
              const totalCount = getCounterTotal(counter);
              const isSurah = !!counter.surahNumber;
              const isExpanded = !!expandedLogs[counter._id];

              return (
                <div key={counter._id} className="dashboard-card p-5 relative overflow-hidden flex flex-col justify-between space-y-4">
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                          {isSurah ? <BookOpen className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-normal font-outfit text-slate-800 dark:text-slate-100">{counter.name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {isSurah && counter.fromAyah && counter.toAyah && (
                              <span className="text-4xs font-normal text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                                Ayahs {counter.fromAyah}-{counter.toAyah}
                              </span>
                            )}
                            {counter.dailyTarget && (
                              <span className="text-4xs font-normal text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                                Daily: {counter.dailyTarget}
                              </span>
                            )}
                            {counter.fridayTarget && (
                              <span className="text-4xs font-normal text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-md">
                                Friday: {counter.fridayTarget}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Menu */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openCreateModal(counter)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-600 transition-all cursor-pointer"
                          title="Edit Register"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this register and all its history?')) {
                              deleteMutation.mutate(counter._id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                          title="Delete Register"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats summary */}
                    <div className="mt-4 grid grid-cols-2 gap-3 bg-amber-50/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-4xs font-normal text-slate-400 uppercase tracking-wider block">Total Count</span>
                        <span className="text-base font-light text-slate-800 dark:text-slate-100 font-outfit mt-0.5 block">{totalCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-4xs font-normal text-slate-400 uppercase tracking-wider block">Starting Offset</span>
                        <span className="text-4xs font-normal text-slate-600 dark:text-slate-400 mt-1 block">
                          {counter.initialCount.toLocaleString()} ({new Date(counter.initialDate).toLocaleDateString()})
                        </span>
                      </div>
                    </div>

                    {/* Notes display */}
                    {counter.notes && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-100/10 p-2 rounded-xl border border-slate-200/5 dark:border-slate-700/10 italic">
                        Note: {counter.notes}
                      </p>
                    )}

                    {/* Inline Logging Form */}
                    <div className="mt-4 pt-3 border-t border-slate-200/20 dark:border-slate-800/30">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Log Daily Readings</p>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <input
                            type="number"
                            min="1"
                            placeholder="Count (e.g. 1)"
                            value={logCounts[counter._id] || ''}
                            onChange={(e) => setLogCounts(prev => ({ ...prev, [counter._id]: e.target.value }))}
                            className="w-full px-2.5 py-1.5 text-2xs rounded-xl focus:outline-none liquid-glass-input border border-slate-200/10 dark:border-slate-700/20"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={logDates[counter._id] || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setLogDates(prev => ({ ...prev, [counter._id]: e.target.value }))}
                            className="w-full px-2.5 py-1.5 text-2xs rounded-xl focus:outline-none liquid-glass-input border border-slate-200/10 dark:border-slate-700/20"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Note (e.g. Subah, Juma extra)"
                          value={logNotes[counter._id] || ''}
                          onChange={(e) => setLogNotes(prev => ({ ...prev, [counter._id]: e.target.value }))}
                          className="flex-1 px-2.5 py-1.5 text-2xs rounded-xl focus:outline-none liquid-glass-input border border-slate-200/10 dark:border-slate-700/20"
                        />
                        <button
                          onClick={() => handleAddLogInline(counter._id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-2xs font-extrabold transition-colors cursor-pointer"
                        >
                          Log +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Log History Accordion */}
                  <div className="mt-4 pt-3 border-t border-slate-200/20 dark:border-slate-800/30">
                    <button
                      onClick={() => toggleLogsExpanded(counter._id)}
                      className="w-full flex items-center justify-between text-2xs font-bold text-slate-500 dark:text-slate-400 hover:text-gold-550 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        <span>Show History ({(counter.logs || []).length})</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="mt-3 overflow-x-auto max-h-48 overflow-y-auto border border-slate-200/10 dark:border-slate-700/30 rounded-xl bg-slate-50/10">
                        <table className="min-w-full text-[10px] text-slate-600 dark:text-slate-350 text-left">
                          <thead className="bg-slate-100/30 dark:bg-slate-900/30 text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-slate-200/10 dark:border-slate-700/20">
                            <tr>
                              <th className="px-2.5 py-2">Date</th>
                              <th className="px-2.5 py-2">Prev</th>
                              <th className="px-2.5 py-2">Added</th>
                              <th className="px-2.5 py-2">New</th>
                              <th className="px-2.5 py-2">Notes</th>
                              <th className="px-2.5 py-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                            {/* Baseline row */}
                            <tr className="bg-amber-500/5 dark:bg-amber-950/5">
                              <td className="px-2.5 py-1.5">{new Date(counter.initialDate).toLocaleDateString()}</td>
                              <td className="px-2.5 py-1.5">-</td>
                              <td className="px-2.5 py-1.5 font-bold text-amber-600 dark:text-amber-400">Baseline</td>
                              <td className="px-2.5 py-1.5 font-bold">{counter.initialCount}</td>
                              <td className="px-2.5 py-1.5 italic text-slate-500">{t('counter.baseline')}</td>
                              <td className="px-2.5 py-1.5 text-right">-</td>
                            </tr>
                            
                            {/* Logged increments */}
                            {(() => {
                              let running = counter.initialCount;
                              return (counter.logs || []).map((log) => {
                                const prev = running;
                                running += log.count;
                                return (
                                  <tr key={log._id}>
                                    <td className="px-2.5 py-1.5">{new Date(log.date).toLocaleDateString()}</td>
                                    <td className="px-2.5 py-1.5">{prev.toLocaleString()}</td>
                                    <td className="px-2.5 py-1.5 font-bold text-emerald-600 dark:text-emerald-400">+{log.count}</td>
                                    <td className="px-2.5 py-1.5 font-bold">{running.toLocaleString()}</td>
                                    <td className="px-2.5 py-1.5 text-slate-500">{log.notes || '-'}</td>
                                    <td className="px-2.5 py-1.5 text-right">
                                      <button
                                        onClick={() => {
                                          if (confirm('Delete this log entry?')) {
                                            deleteLogMutation.mutate({ counterId: counter._id, logId: log._id });
                                          }
                                        }}
                                        className="p-1 hover:text-red-500 text-slate-400 transition-colors cursor-pointer"
                                        title="Delete Log"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal Backdrop (Portal) */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg sm:max-w-xl dashboard-card p-6 animate-scaleUp text-left max-h-[90vh] overflow-y-auto font-normal space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-normal font-outfit text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <span>{editingCounter ? t('counter.edit') : t('counter.newCounter')}</span>
              </h3>
              <button onClick={closeCreateModal} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCounter} className="space-y-4 pt-1">
              {/* Counter Title Input (User Custom Input Only) */}
              <div>
                <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1.5">
                  Counter Name / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Durood Sharif, Surah Yaseen, Ahad Nama, Kalma"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="block w-full px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 h-[40px] bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 font-normal"
                />
              </div>

              {/* Step 2: Total Count + Till Date */}
              <div className="bg-amber-50/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <p className="text-3xs font-normal text-slate-400 uppercase tracking-wider">
                  {t('counter.totalTillDate')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.initialCountLabel')}</label>
                    <input type="number" min="0" placeholder="e.g. 571" value={initialCount}
                      onChange={(e) => setInitialCount(parseInt(e.target.value) || 0)}
                      className="block w-full px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                  </div>
                  <div>
                    <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.tillDate')}</label>
                    <input type="date" value={initialDate} onChange={(e) => setInitialDate(e.target.value)}
                      className="block w-full px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                  </div>
                </div>

                {/* Calculator tool */}
                <div className="border border-dashed border-amber-300/40 dark:border-slate-700 rounded-xl overflow-hidden bg-white/40 dark:bg-slate-900/20">
                  <button type="button" onClick={() => { setShowCalc(v => !v); setCalcResult(null); }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 cursor-pointer font-outfit">
                    <span className="text-3xs font-normal text-amber-800 dark:text-amber-300 flex items-center space-x-2">
                      <Calculator className="w-4 h-4 text-amber-600" />
                      <span>{t('counter.calcToggle')}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform duration-200 ${showCalc ? 'rotate-180' : ''}`} />
                  </button>
                  {showCalc && (
                    <div className="px-3.5 pb-3.5 pt-2 space-y-3">
                      <p className="text-3xs text-slate-400 font-normal">{t('counter.calcDesc')}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.calcFromDate')}</label>
                          <input type="date" value={calcFromDate}
                            onChange={(e) => { setCalcFromDate(e.target.value); setCalcResult(null); }}
                            className="block w-full px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                        </div>
                        <div>
                          <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.calcToDate')}</label>
                          <input type="date" value={calcToDate}
                            onChange={(e) => { setCalcToDate(e.target.value); setCalcResult(null); }}
                            className="block w-full px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.calcDailyCount')}</label>
                          <input type="number" min="0" placeholder="e.g. 1" value={calcDailyCount}
                            onChange={(e) => { setCalcDailyCount(e.target.value === '' ? '' : parseInt(e.target.value) || 0); setCalcResult(null); }}
                            className="block w-full px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                        </div>
                        <div>
                          <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.calcFridayExtra')}</label>
                          <input type="number" min="0" placeholder="e.g. 15" value={calcFridayExtra}
                            onChange={(e) => { setCalcFridayExtra(e.target.value === '' ? '' : parseInt(e.target.value) || 0); setCalcResult(null); }}
                            className="block w-full px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                        </div>
                      </div>
                      <button type="button" onClick={handleCalculateHistory} disabled={!calcFromDate || !calcToDate}
                        className="w-full py-2 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-40 text-white text-xs font-normal transition-colors cursor-pointer shadow-xs font-outfit">
                        {t('counter.calcButton')}
                      </button>
                      {calcResult && (
                        <div className="border border-amber-200 dark:border-slate-800 rounded-xl p-3 space-y-2 bg-white/50 dark:bg-slate-900/50">
                          <div className="flex items-center justify-between">
                            <span className="text-3xs text-slate-400 font-normal uppercase tracking-wider">{t('counter.calcResult')}</span>
                            <span className="text-sm font-light font-outfit text-amber-800 dark:text-amber-400">{calcResult.total.toLocaleString()}</span>
                          </div>
                          <p className="text-3xs text-slate-400 font-normal leading-relaxed">
                            {t('counter.calcBreakdown', { days: String(calcResult.days), daily: String(typeof calcDailyCount === 'number' ? calcDailyCount : 0), fridays: String(calcResult.fridays), friday: String(typeof calcFridayExtra === 'number' ? calcFridayExtra : 0), total: String(calcResult.total) })}
                          </p>
                          <button type="button"
                            onClick={() => { setInitialCount(prev => prev + calcResult.total); setCalcResult(null); setShowCalc(false); toast.success(`Added ${calcResult.total.toLocaleString()} to count!`); }}
                            className="w-full py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-normal transition-colors cursor-pointer flex items-center justify-center space-x-1.5 font-outfit">
                            <Plus className="w-3.5 h-3.5 text-white" />
                            <span>{t('counter.calcApply')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Optional Targets & Info */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <button type="button" onClick={() => setShowMoreDetails(v => !v)}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-normal text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer font-outfit">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showMoreDetails ? 'rotate-180' : ''}`} />
                  <span>{showMoreDetails ? t('counter.lessDetails') : t('counter.moreDetails')}</span>
                </button>
              </div>

              {showMoreDetails && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ayah Range (Optional) */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl p-3 space-y-2 text-left">
                      <span className="block text-3xs font-normal text-slate-400 uppercase tracking-wider">Ayah Range / Verses (Optional)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.fromAyahLabel')}</label>
                          <input type="number" min="1" placeholder="e.g. 1" value={fromAyah}
                            onChange={(e) => setFromAyah(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                            className="block w-full px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                        </div>
                        <div>
                          <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.toAyahLabel')}</label>
                          <input type="number" min="1" placeholder="e.g. 78" value={toAyah}
                            onChange={(e) => setToAyah(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                            className="block w-full px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                        </div>
                      </div>
                    </div>

                    {/* Targets */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl p-3 space-y-2 text-left">
                      <span className="block text-3xs font-normal text-slate-400 uppercase tracking-wider">Recitation Targets</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.tableHeaderDaily')}</label>
                          <input type="number" min="1" placeholder="e.g. 1" value={dailyTarget}
                            onChange={(e) => setDailyTarget(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                            className="block w-full px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                        </div>
                        <div>
                          <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.tableHeaderFriday')}</label>
                          <input type="number" min="1" placeholder="e.g. 15" value={fridayTarget}
                            onChange={(e) => setFridayTarget(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                            className="block w-full px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1">{t('counter.notesOptional')}</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                      placeholder="e.g. Read every Friday, 15 times"
                      className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" />
                  </div>
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeCreateModal}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-normal text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center font-outfit">
                  {t('counter.cancel')}
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-xs font-normal text-white transition-colors cursor-pointer shadow-xs text-center disabled:opacity-50 font-outfit">
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : t('counter.saveCounter')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
