import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recitationApi } from '../services/recitations.js';
import type { RecitationRecord } from '../services/recitations.js';
import { Calendar as CalendarIcon, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext.tsx';

export const RecitationForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customName, setCustomName] = useState<string>('');
  const [customCount, setCustomCount] = useState<number | ''>(1);
  const [notes, setNotes] = useState<string>('');



  // Fetch record for editing
  const { data: editRecord, isLoading: recordLoading } = useQuery<RecitationRecord>({
    queryKey: ['recitation', id],
    queryFn: () => recitationApi.getRecitation(id!),
    enabled: isEditMode,
  });

  // Fetch recent history
  const { data: recentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['recentRecitations'],
    queryFn: () => recitationApi.getRecitations({ limit: 5 })
  });

  // Populate form if editing
  useEffect(() => {
    if (isEditMode && editRecord) {
      setDate(new Date(editRecord.date).toISOString().split('T')[0]);
      setCustomName(editRecord.surahName);
      setCustomCount(editRecord.ayahCount);
      setNotes(editRecord.notes || '');
    }
  }, [isEditMode, editRecord]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: recitationApi.createRecitation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recitations'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['recentRecitations'] });

      toast.success(`Logged "${data.surahName}"!`);
      navigate('/history');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || t('toast.errorSomething');
      toast.error(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => recitationApi.updateRecitation(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recitations'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      toast.success(`Updated "${data.surahName}"!`);
      navigate('/history');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || t('toast.errorSomething');
      toast.error(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = customName.trim() || 'Custom Reading';
    const count = typeof customCount === 'number' ? customCount : 1;

    const payload = {
      date,
      surahNumber: 1, // Fallback for backend validation
      surahName: name,
      type: 'custom',
      ayahCount: count,
      notes: notes || undefined
    };

    if (isEditMode) {
      updateMutation.mutate({ id: id!, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditMode && recordLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-normal">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-amber-600 rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-slate-400">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 font-normal text-left">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer text-xs font-normal font-outfit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start font-normal">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="dashboard-card p-5 space-y-4">
            <h2 className="font-outfit font-normal text-base text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>{isEditMode ? 'Edit Recitation Log' : 'Log Recitation Entry'}</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date Picker */}
              <div>
                <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1.5">
                  Recitation Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Recitation / Reading Name */}
              <div>
                <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1.5">
                  Recitation / Reading Name
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Surah Yaseen (3 times), Astaghfirullah, Darood Sharif..."
                  className="block w-full px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Count / Total Number / Verses */}
              <div>
                <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1.5">
                  Count / Total Verses / Times Read
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="e.g. 100 or 249"
                  className="block w-full px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="block w-full px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                  placeholder="e.g. Recited after Fajr prayer"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-normal text-white bg-amber-800 hover:bg-amber-900 transition-colors cursor-pointer shadow-xs font-outfit disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (isEditMode ? 'Update Log' : 'Save Recitation Entry')}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-4 font-normal">
          {/* Recent Recitation Activity Logs */}
          <div className="dashboard-card p-5 space-y-3 font-normal">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-xs flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Recent Activity</span>
            </h3>

            {historyLoading ? (
              <div className="py-4 text-center text-xs text-slate-400 font-normal">{t('buttons.loading')}</div>
            ) : recentHistory?.recitations?.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center font-normal">No recent recitation records found.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentHistory?.recitations?.map((record) => (
                  <div key={record._id} className="py-2 flex items-center justify-between first:pt-0 last:pb-0 font-normal">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-normal font-outfit text-slate-800 dark:text-slate-200 truncate">
                        {record.surahName}
                      </p>
                      <p className="text-4xs text-slate-400 font-normal truncate">
                        {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-4xs font-normal text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-300/40 font-outfit">
                        +{record.ayahCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info / Guide */}
          <div className="dashboard-card p-5 space-y-2.5 font-normal">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-xs flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Custom Registry Guidelines</span>
            </h3>
            <ul className="text-4xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed font-normal">
              <li>Type individual titles like <b>Surah Yaseen 3 times</b> or <b>Darood Sharif 500 times</b>.</li>
              <li>Use quick suggestion chips for fast entry.</li>
              <li>Your total recitation counts and daily streaks update automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
