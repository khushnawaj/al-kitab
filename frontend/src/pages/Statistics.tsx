import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '../services/statistics.js';
import type { StatisticsData } from '../services/statistics.js';
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  Activity
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.tsx';

export const Statistics: React.FC = () => {
  const { t } = useLanguage();
  const { data: stats, isLoading } = useQuery<StatisticsData>({
    queryKey: ['statistics'],
    queryFn: statisticsApi.getStatistics,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-800 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">{t('statistics.loading')}</p>
      </div>
    );
  }

  const charts = stats?.charts;
  const last7Days = charts?.last7Days || [];
  const topSurahs = charts?.topSurahs || [];
  const monthlyProgress = charts?.monthlyProgress || [];

  // Bar Chart (Last 7 Days) helpers
  const maxDayCount = Math.max(...last7Days.map(d => d.count), 1);
  
  // Line Chart (Monthly) helpers
  const maxMonthCount = Math.max(...monthlyProgress.map(m => m.count), 1);
  const linePoints = monthlyProgress.map((m, idx) => {
    const x = (idx * (280 / 11)) + 20; // range 20 to 300
    const y = 120 - ((m.count / maxMonthCount) * 80); // range 40 to 120 (max height 80px)
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="max-w-5xl mx-auto space-y-4 font-normal text-left">
      {/* Title */}
      <div className="text-left">
        <h1 className="font-outfit text-xl font-normal text-slate-800 dark:text-slate-100 tracking-tight">
          {t('statistics.title')}
        </h1>
        <p className="text-slate-400 text-xs font-normal mt-0.5">
          {t('statistics.desc')}
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Ayahs */}
        <div className="dashboard-card p-3.5 text-left">
          <BookOpen className="w-4 h-4 text-emerald-600 mb-1.5" />
          <p className="text-4xs text-slate-400 font-normal uppercase tracking-wider">{t('statistics.totalAyahs')}</p>
          <p className="font-outfit text-lg font-light text-slate-800 dark:text-slate-100 mt-0.5">
            {stats?.totalAyahs || 0}
          </p>
        </div>

        {/* Current Streak */}
        <div className="dashboard-card p-3.5 text-left">
          <Flame className="w-4 h-4 text-amber-600 mb-1.5" />
          <p className="text-4xs text-slate-400 font-normal uppercase tracking-wider">{t('statistics.streakCurrent')}</p>
          <p className="font-outfit text-lg font-light text-slate-800 dark:text-slate-100 mt-0.5">
            {t('statistics.streakDays', { count: stats?.currentStreak || 0 })}
          </p>
        </div>

        {/* Daily Average */}
        <div className="dashboard-card p-3.5 text-left">
          <Activity className="w-4 h-4 text-teal-600 mb-1.5" />
          <p className="text-4xs text-slate-400 font-normal uppercase tracking-wider">{t('statistics.dailyAvg')}</p>
          <p className="font-outfit text-lg font-light text-slate-800 dark:text-slate-100 mt-0.5">
            {t('history.ayahsCount', { count: stats?.averagePerDay || 0 })}
          </p>
        </div>

        {/* Most Recited */}
        <div className="dashboard-card p-3.5 text-left">
          <Trophy className="w-4 h-4 text-amber-600 mb-1.5" />
          <p className="text-4xs text-slate-400 font-normal uppercase tracking-wider">{t('statistics.mostRecited')}</p>
          <p className="font-outfit text-sm font-normal text-slate-800 dark:text-slate-100 mt-0.5 truncate" title={stats?.mostRecitedSurah}>
            {stats?.mostRecitedSurah || t('statistics.none')}
          </p>
        </div>
      </div>

      {/* SVG Chart 1: Last 7 Days Activity (Bar Chart) */}
      <div className="dashboard-card p-4">
        <h3 className="font-outfit text-xs font-normal text-slate-800 dark:text-slate-100 mb-3 text-left">
          {t('statistics.last7Days')}
        </h3>

        <div className="relative w-full h-36">
          <svg className="w-full h-full" viewBox="0 0 320 140">
            {/* Grid Lines */}
            <line x1="20" y1="20" x2="300" y2="20" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="0.5" />
            <line x1="20" y1="60" x2="300" y2="60" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="0.5" />
            <line x1="20" y1="100" x2="300" y2="100" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="0.5" />
            <line x1="20" y1="110" x2="300" y2="110" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

            {/* Bars */}
            {last7Days.map((d, idx) => {
              const x = (idx * 40) + 30;
              const barHeight = (d.count / maxDayCount) * 80;
              const y = 110 - barHeight;

              return (
                <g key={d.date} className="group cursor-pointer">
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width="20"
                    height={barHeight}
                    rx="4"
                    className="fill-amber-800 dark:fill-amber-600 hover:fill-amber-900 transition-colors"
                  />
                  {/* Tooltip text (shown on hover) */}
                  <text
                    x={x + 10}
                    y={Math.max(15, y - 5)}
                    textAnchor="middle"
                    className="text-4xs font-normal fill-amber-700 dark:fill-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {d.count}
                  </text>
                  {/* Day Label */}
                  <text
                    x={x + 10}
                    y="125"
                    textAnchor="middle"
                    className="text-4xs font-normal fill-slate-400"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* SVG Chart 2: Monthly Progress (Line Chart) */}
      <div className="dashboard-card p-4">
        <h3 className="font-outfit text-xs font-normal text-slate-800 dark:text-slate-100 mb-3 text-left">
          {t('statistics.monthlyTrend')}
        </h3>

        <div className="relative w-full h-36">
          <svg className="w-full h-full" viewBox="0 0 320 140">
            {/* Grid Lines */}
            <line x1="20" y1="20" x2="300" y2="20" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="0.5" />
            <line x1="20" y1="60" x2="300" y2="60" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="0.5" />
            <line x1="20" y1="100" x2="300" y2="100" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="0.5" />
            <line x1="20" y1="120" x2="300" y2="120" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

            {/* Line Path */}
            {monthlyProgress.length > 0 && (
              <>
                <polyline
                  fill="none"
                  stroke="#169b5c"
                  strokeWidth="2.5"
                  points={linePoints}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Dots on the line */}
                {monthlyProgress.map((m, idx) => {
                  const x = (idx * (280 / 11)) + 20;
                  const y = 120 - ((m.count / maxMonthCount) * 80);

                  return (
                    <g key={m.month} className="group cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r="3.5"
                        className="fill-white stroke-emerald-600 group-hover:r-5 transition-all"
                        strokeWidth="2.5"
                      />
                      <text
                        x={x}
                        y={Math.max(12, y - 8)}
                        textAnchor="middle"
                        className="text-4xs font-normal fill-slate-700 dark:fill-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {m.count}
                      </text>
                      <text
                        x={x}
                        y="132"
                        textAnchor="middle"
                        className="text-4xs font-normal fill-slate-400"
                      >
                        {m.month[0]}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Top 5 Surahs (Horizontal Bar Chart) */}
      <div className="dashboard-card p-4 text-left font-normal">
        <h3 className="font-outfit text-xs font-normal text-slate-800 dark:text-slate-100 mb-3">
          {t('statistics.mostRecitedTitle')}
        </h3>

        {topSurahs.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6 font-normal">{t('statistics.noData')}</p>
        ) : (
          <div className="space-y-3">
            {topSurahs.map((surah, index) => {
              const maxVal = topSurahs[0].count;
              const percentage = maxVal > 0 ? (surah.count / maxVal) * 100 : 0;
              return (
                <div key={surah.surahNumber} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-normal">
                    <span className="font-outfit text-slate-700 dark:text-slate-200">
                      {index + 1}. {surah.name}
                    </span>
                    <span className="text-slate-400 text-4xs">
                      {t('history.ayahsCount', { count: surah.count })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-800 dark:bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
