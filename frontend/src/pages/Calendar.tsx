import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recitationApi } from '../services/recitations.js';
import { counterApi } from '../services/counters.js';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Book, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.js';
import toast from 'react-hot-toast';

interface CalendarActivityRecord {
  id: string;
  name: string;
  type: string;
  count: number;
  isRegisterLog: boolean;
}

export const Calendar: React.FC = () => {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Quick Add Recitation Modal State (Custom Only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCount, setCustomCount] = useState<number | ''>(1);
  const [notes, setNotes] = useState('');



  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Queries
  const { data: recitationsData } = useQuery({
    queryKey: ['recitations', 'calendar'],
    queryFn: () => recitationApi.getRecitations({ page: 1, limit: 1000 }),
  });

  const { data: countersData } = useQuery({
    queryKey: ['counters', 'calendar'],
    queryFn: counterApi.getCounters,
  });

  // Mutations
  const createRecitationMutation = useMutation({
    mutationFn: recitationApi.createRecitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recitations'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['recentRecitations'] });
      toast.success('Log saved successfully!');
      setIsAddModalOpen(false);
      resetAddForm();
    },
    onError: () => {
      toast.error('Failed to save log');
    }
  });

  const deleteRecitationMutation = useMutation({
    mutationFn: recitationApi.deleteRecitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recitations'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['recentRecitations'] });
      toast.success('Entry deleted');
    },
    onError: () => {
      toast.error('Failed to delete entry');
    }
  });

  const resetAddForm = () => {
    setCustomName('');
    setCustomCount(1);
    setNotes('');
  };

  const recitations = recitationsData?.recitations || [];
  const counters = countersData || [];

  // Group everything by date string "YYYY-MM-DD"
  const activitiesByDate = (() => {
    const acc: { [key: string]: { records: CalendarActivityRecord[]; total: number } } = {};

    // 1. Group direct recitations
    recitations.forEach(record => {
      const dateStr = new Date(record.date).toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = { records: [], total: 0 };
      }
      acc[dateStr].records.push({
        id: record._id,
        name: record.surahName,
        type: record.type === 'entire' ? 'Entire Surah' : (record.fromAyah ? `Verses ${record.fromAyah}-${record.toAyah}` : 'Custom Entry'),
        count: record.ayahCount,
        isRegisterLog: false
      });
      acc[dateStr].total += record.ayahCount;
    });

    // 2. Group register/counter entry logs
    counters.forEach(counter => {
      counter.logs.forEach(log => {
        const dateStr = new Date(log.date).toISOString().split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = { records: [], total: 0 };
        }
        acc[dateStr].records.push({
          id: log._id,
          name: counter.name,
          type: log.notes || 'Register Entry',
          count: log.count,
          isRegisterLog: true
        });
        acc[dateStr].total += log.count;
      });
    });

    return acc;
  })();

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => daysInPrevMonth - firstDayOfMonth + 1 + i);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const totalCells = 42; // 6 rows of 7 days
  const nextMonthDaysCount = totalCells - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

  // Compute max activity for the current month (for intensity scaling)
  const maxActivityInMonth = Math.max(
    1,
    ...currentMonthDays.map(d => {
      const fm = String(month + 1).padStart(2, '0');
      const fd = String(d).padStart(2, '0');
      return activitiesByDate[`${year}-${fm}-${fd}`]?.total || 0;
    })
  );

  // Returns 0-4 intensity level based on activity vs max
  const getIntensityLevel = (total: number): number => {
    if (total === 0) return 0;
    const ratio = total / maxActivityInMonth;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  // Intensity level → CSS classes (background + text + border)
  const intensityClasses: Record<number, string> = {
    0: 'bg-white/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
    1: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/60 text-slate-700 dark:text-slate-200 hover:border-emerald-400',
    2: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300/70 dark:border-emerald-800/70 text-slate-700 dark:text-slate-200 hover:border-emerald-500',
    3: 'bg-emerald-200 dark:bg-emerald-800/50 border-emerald-400/80 dark:border-emerald-700/80 text-slate-800 dark:text-slate-100 hover:border-emerald-500',
    4: 'bg-emerald-400/70 dark:bg-emerald-700/60 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100 hover:border-emerald-600',
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now.toISOString().split('T')[0]);
  };

  const getDayDetails = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return activitiesByDate[dateStr] || null;
  };

  const isSelected = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return selectedDate === dateStr;
  };

  const isTodayDay = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return todayStr === dateStr;
  };

  const handleDateClick = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    setSelectedDate(dateStr);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const name = customName.trim() || 'Custom Reading';
    const count = typeof customCount === 'number' ? customCount : 1;

    createRecitationMutation.mutate({
      date: selectedDate,
      surahNumber: 1, // Fallback for backend validation schema
      surahName: name,
      type: 'custom',
      ayahCount: count,
      notes: notes || undefined
    });
  };

  // Formatted date labels
  const formattedFullCurrentDate = today.toLocaleDateString(
    language === 'ur' ? 'ur-PK' : 'en-US',
    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  );

  const formattedMonthYear = currentDate.toLocaleDateString(
    language === 'ur' ? 'ur-PK' : 'en-US',
    { month: 'long', year: 'numeric' }
  );

  const formattedSelectedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString(
        language === 'ur' ? 'ur-PK' : 'en-US',
        { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
      )
    : '';

  const selectedDetails = selectedDate ? activitiesByDate[selectedDate] : null;

  return (
    <div className="space-y-4 max-w-5xl mx-auto page-enter text-left font-normal">

      {/* Full Current Date Header Banner */}
      <div className="dashboard-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <p className="text-4xs font-normal text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Today's Date</span>
          </p>
          <h1 className="font-outfit text-xl sm:text-2xl font-light text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
            {formattedFullCurrentDate}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleJumpToToday}
            className="px-3.5 py-1.5 rounded-xl font-outfit text-xs font-normal border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-outfit text-xs font-normal text-white bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Recitation</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Calendar Grid Card (2 Columns on Desktop) */}
        <div className="lg:col-span-2 dashboard-card p-4 sm:p-5 space-y-4 text-left">
          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-base">
              {formattedMonthYear}
            </h2>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-outfit">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day} className="text-4xs font-normal text-slate-400 uppercase tracking-wider py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 text-center font-outfit">
            {/* Previous Month Days */}
            {prevMonthDays.map((day, idx) => (
              <div
                key={`prev-${idx}`}
                className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs font-light text-slate-300 dark:text-slate-700 select-none rounded-xl bg-slate-50/20 dark:bg-slate-900/10"
              >
                {day}
              </div>
            ))}

            {/* Current Month Days */}
            {currentMonthDays.map((day) => {
              const dayDetails = getDayDetails(day);
              const selected = isSelected(day);
              const isToday = isTodayDay(day);
              const intensity = getIntensityLevel(dayDetails?.total || 0);

              return (
                <div
                  key={`curr-${day}`}
                  onClick={() => handleDateClick(day)}
                  title={dayDetails ? `${dayDetails.total} total recitations` : undefined}
                  className={`h-14 sm:h-16 flex flex-col items-center justify-between p-1 text-xs font-normal rounded-xl cursor-pointer transition-all relative border ${
                    selected 
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs' 
                      : isToday
                      ? 'bg-amber-50/70 dark:bg-amber-900/20 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                      : intensityClasses[intensity]
                  }`}
                >
                  <span className={`text-3xs font-normal ${selected ? 'text-white' : ''}`}>
                    {day}
                  </span>

                  {/* Activity Badge */}
                  {dayDetails && (
                    <span className={`text-[9px] font-normal px-1 rounded-full truncate max-w-full ${
                      selected 
                        ? 'bg-amber-700 text-white' 
                        : intensity >= 3
                        ? 'bg-emerald-600/80 text-white'
                        : 'bg-emerald-200 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                    }`}>
                      +{dayDetails.total}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Next Month Days */}
            {nextMonthDays.map((day, idx) => (
              <div
                key={`next-${idx}`}
                className="h-14 sm:h-16 flex flex-col items-center justify-center text-xs font-light text-slate-300 dark:text-slate-700 select-none rounded-xl bg-slate-50/20 dark:bg-slate-900/10"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Color Intensity Legend */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-3xs text-slate-400 font-normal uppercase tracking-wider">Activity</span>
            <div className="flex items-center gap-1">
              <span className="text-3xs text-slate-400 font-normal mr-1">Less</span>
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-4 h-4 rounded-md border ${
                    level === 0
                      ? 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                      : level === 1
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
                      : level === 2
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-800'
                      : level === 3
                      ? 'bg-emerald-200 dark:bg-emerald-800/50 border-emerald-400 dark:border-emerald-700'
                      : 'bg-emerald-400/70 dark:bg-emerald-700/60 border-emerald-500 dark:border-emerald-600'
                  }`}
                />
              ))}
              <span className="text-3xs text-slate-400 font-normal ml-1">More</span>
            </div>
          </div>
        </div>

        {/* Selected Date Activity & Direct Logging Panel (1 Column) */}
        <div className="dashboard-card p-5 space-y-4 text-left font-normal">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <p className="text-4xs font-normal text-slate-400 uppercase tracking-wider">Selected Date</p>
              <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm">
                {formattedSelectedDate}
              </h3>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-normal transition-all cursor-pointer shadow-xs font-outfit flex items-center space-x-1"
              title={`Log recitation for ${formattedSelectedDate}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
          </div>

          {!selectedDetails ? (
            <div className="text-center py-8 space-y-3">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs text-slate-400 font-normal">
                No recitations logged for this day yet.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="py-1.5 px-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-normal transition-all cursor-pointer shadow-xs font-outfit"
              >
                + Add Recitation Today
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Daily Summary Pill */}
              <div className="p-3 bg-amber-50/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <span className="text-4xs text-slate-400 font-normal uppercase tracking-wider">
                  Total Ayahs Recited:
                </span>
                <span className="text-base font-light text-emerald-600 dark:text-emerald-400 font-outfit">
                  {selectedDetails.total.toLocaleString()}
                </span>
              </div>

              {/* Records List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
                {selectedDetails.records.map((record) => (
                  <div 
                    key={record.id}
                    className="p-3 bg-white/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs font-normal"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        record.isRegisterLog ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}>
                        {record.isRegisterLog ? <Book className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-outfit font-normal text-slate-800 dark:text-slate-200 truncate">
                          {record.name}
                        </p>
                        <p className="text-4xs text-slate-400 font-normal truncate">
                          {record.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-outfit text-xs font-normal text-amber-800 dark:text-amber-400">
                        +{record.count}
                      </span>
                      {!record.isRegisterLog && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this recitation record?')) {
                              deleteRecitationMutation.mutate(record.id);
                            }
                          }}
                          className="p-1 hover:text-red-500 text-slate-400 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Recitation Modal for Selected Date (Portal) */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg sm:max-w-xl dashboard-card p-6 animate-scaleUp text-left max-h-[90vh] overflow-y-auto font-normal space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-normal font-outfit text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Log Recitation for {formattedSelectedDate}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form (Custom Only Input) */}
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-1">
              {/* Date Input (Pre-filled) */}
              <div>
                <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1.5">
                  Recitation Date
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="block w-full px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 h-[40px] bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* What did you read / recite? (Custom Input) */}
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
                  className="block w-full px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 h-[40px] bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
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
                  className="block w-full px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 h-[40px] bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-3xs font-normal text-slate-400 uppercase tracking-wider mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Recited after Fajr prayer"
                  className="block w-full px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-normal text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center font-outfit"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRecitationMutation.isPending}
                  className="py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-xs font-normal text-white transition-colors cursor-pointer shadow-xs text-center disabled:opacity-50 font-outfit"
                >
                  {createRecitationMutation.isPending ? 'Saving...' : 'Save Log'}
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
