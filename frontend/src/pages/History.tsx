import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { recitationApi } from '../services/recitations.js';
import type { RecitationRecord } from '../services/recitations.js';
import { SURAHS } from '../constants/surahs.js';
import { 
  Search, 
  ArrowUpDown, 
  Edit2, 
  Trash2, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext.tsx';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [surahNumber, setSurahNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Confirm delete modal state
  const [deletingRecord, setDeletingRecord] = useState<RecitationRecord | null>(null);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['recitations', { search, surahNumber, startDate, endDate, sortField, sortOrder, page }],
    queryFn: () => recitationApi.getRecitations({
      search,
      surahNumber,
      startDate,
      endDate,
      sortField,
      sortOrder,
      page,
      limit
    }),
  });

  const recitations = data?.recitations || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (record: RecitationRecord) => recitationApi.deleteRecitation(record._id),
    onSuccess: (_, record) => {
      // If it was a successful delete, we can construct an undo restore
      queryClient.invalidateQueries({ queryKey: ['recitations'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['recentRecitations'] });
      setDeletingRecord(null);

      // Re-create mechanism: we need the full original record details to restore it
      toast.success(
        (tParam) => (
          <div className="flex items-center justify-between space-x-2">
            <span>{t('history.toastDeleted')}</span>
            <button 
              onClick={() => {
                toast.dismiss(tParam.id);
                restoreMutation.mutate({
                  date: record.date,
                  surahNumber: record.surahNumber,
                  surahName: record.surahName,
                  type: record.type,
                  fromAyah: record.fromAyah,
                  toAyah: record.toAyah,
                  notes: record.notes
                });
              }}
              className="text-amber-600 dark:text-amber-400 font-semibold text-xs hover:underline cursor-pointer"
            >
              {t('history.undo')}
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    },
    onError: (error: any) => {
      toast.error(error.message || t('toast.errorSomething'));
      setDeletingRecord(null);
    }
  });

  const restoreMutation = useMutation({
    mutationFn: recitationApi.createRecitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recitations'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['recentRecitations'] });
      toast.success(t('history.toastRestored'));
    }
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSurahNumber('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto page-enter text-left font-normal">

      {/* Filters Box */}
      <div className="dashboard-card p-5 space-y-4 text-left font-normal">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-outfit text-sm">
          <Filter className="w-4 h-4 text-amber-600" />
          <span>{t('history.filterRecords')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('history.searchPlaceholder')}
              className="block w-full pl-10 pr-4 py-2 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Surah dropdown filter */}
          <div>
            <select
              value={surahNumber}
              onChange={(e) => { setSurahNumber(e.target.value); setPage(1); }}
              className="block w-full px-4 py-2 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
            >
              <option value="">{t('history.allSurahs')}</option>
              {SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.transliteration} ({s.arabicName})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              placeholder={t('history.startDate')}
              className="block w-full px-4 py-2 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
            />
            <span className="absolute right-3 top-2.5 text-4xs text-slate-400 uppercase pointer-events-none">{t('history.startDate')}</span>
          </div>

          {/* End Date */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              placeholder={t('history.endDate')}
              className="block w-full px-4 py-2 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
            />
            <span className="absolute right-3 top-2.5 text-4xs text-slate-400 uppercase pointer-events-none">{t('history.endDate')}</span>
          </div>
        </div>

        {/* Sorting Buttons */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => handleSort('date')}
            className={`px-3 py-1.5 rounded-xl text-xs font-normal font-outfit flex items-center space-x-1.5 border transition-all cursor-pointer ${
              sortField === 'date'
                ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300/40'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span>{t('history.sortDate')}</span>
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleSort('surahNumber')}
            className={`px-3 py-1.5 rounded-xl text-xs font-normal font-outfit flex items-center space-x-1.5 border transition-all cursor-pointer ${
              sortField === 'surahNumber'
                ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300/40'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span>{t('history.sortSurah')}</span>
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleSort('ayahCount')}
            className={`px-3 py-1.5 rounded-xl text-xs font-normal font-outfit flex items-center space-x-1.5 border transition-all cursor-pointer ${
              sortField === 'ayahCount'
                ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300/40'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span>{t('history.sortAyahs')}</span>
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {(search || surahNumber || startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-normal font-outfit text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            >
              {t('buttons.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Recitation List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-normal text-slate-400">{t('history.loading')}</p>
        </div>
      ) : recitations.length === 0 ? (
        <div className="dashboard-card p-10 text-center text-slate-400">
          <BookOpen className="w-12 h-12 text-gold-550/40 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t('history.noRecordsFound')}</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-xs mx-auto">
            {t('history.noRecordsDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2.5">
            {recitations.map((record) => (
              <div 
                key={record._id}
                className="gilded-panel bg-white/40 dark:bg-slate-905/30 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:scale-[1.01] transition-all"
              >
                <div className="text-left space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                      {record.surahName}
                    </h4>
                    <span className="text-4xs px-2 py-0.5 rounded font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      #{record.surahNumber}
                    </span>
                  </div>
                  
                  <p className="text-2xs text-slate-400 dark:text-slate-500">
                    {new Date(record.date).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {
                      record.type === 'entire' 
                        ? t('forms.typeEntire') 
                        : `${t('forms.typeRange')}: ${record.fromAyah}-${record.toAyah}`
                    }
                  </p>

                  {record.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-white/30 dark:bg-slate-900/35 px-2.5 py-1.5 rounded-lg border border-slate-200/10 dark:border-slate-800/30 mt-1 max-w-sm">
                      “{record.notes}”
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-gold-600 dark:text-gold-400 font-bold text-xs rounded-full">
                    {t('history.ayahsCount', { count: record.ayahCount })}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {/* Only allow edit if it's not a temporary offline record */}
                    {!record._id.startsWith('offline_') && (
                      <button 
                        onClick={() => navigate(`/edit/${record._id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-gold-500 hover:bg-amber-500/10 transition-colors cursor-pointer touch-target border border-transparent hover:border-amber-500/30 hover:scale-105"
                        title="Edit Record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => setDeletingRecord(record)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer touch-target border border-transparent hover:border-red-500/30 hover:scale-105"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/40 dark:border-slate-800/30">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="touch-target flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-350 disabled:opacity-40 transition-all cursor-pointer bg-white/20 dark:bg-slate-900/20 border border-slate-250/20 dark:border-slate-700/30 hover:scale-[1.02]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t('history.prev')}</span>
              </button>

              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {t('history.pageOf', { page, total: totalPages })}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="touch-target flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-350 disabled:opacity-40 transition-all cursor-pointer bg-white/20 dark:bg-slate-900/20 border border-slate-250/20 dark:border-slate-700/30 hover:scale-[1.02]"
              >
                <span>{t('history.next')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Deletion Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fadeIn">
          <div className="gilded-panel bg-white dark:bg-[#07140e] border rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl text-center relative">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/25">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-800 dark:text-[#fef3c7] text-base">{t('history.deleteTitle')}</h3>
              <p className="text-xs text-slate-500 dark:text-gold-300/60 max-w-[240px] mx-auto">
                {t('history.deleteConfirmText', { name: deletingRecord.surahName })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="touch-target py-2 px-4 rounded-xl border border-slate-200/50 dark:border-slate-800/55 text-xs font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-500/5 transition-colors cursor-pointer"
              >
                {t('buttons.cancel')}
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingRecord)}
                disabled={deleteMutation.isPending}
                className="touch-target py-2 px-4 rounded-xl bg-red-650 hover:bg-red-700 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm shadow-red-600/10"
              >
                {deleteMutation.isPending ? t('buttons.loading') : t('buttons.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
