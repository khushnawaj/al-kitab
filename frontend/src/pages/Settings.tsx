import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useLanguage } from '../contexts/LanguageContext.js';
import { authApi } from '../services/auth.js';
import { goalApi } from '../services/goals.js';
import type { GoalsData } from '../services/goals.js';
import { recitationApi } from '../services/recitations.js';
import { counterApi } from '../services/counters.js';
import { 
  User, 
  Lock, 
  Target, 
  Sun, 
  Moon, 
  Monitor, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Bell, 
  Type,
  Settings as SettingsIcon,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

// Zod schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword'],
});

const goalsFormSchema = z.object({
  dailyGoal: z.number().int().min(1, 'Daily goal must be at least 1 ayah'),
  weeklyGoal: z.number().int().min(1, 'Weekly goal must be at least 1 ayah'),
  monthlyGoal: z.number().int().min(1, 'Monthly goal must be at least 1 ayah'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type GoalsFormValues = z.infer<typeof goalsFormSchema>;

export const Settings: React.FC = () => {
  const { user, updateProfileState, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();

  // Modals state
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'goals' | 'account' | 'backup'>('general');

  // Font size setting
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xl'>(() => {
    return (localStorage.getItem('font_size') as any) || 'normal';
  });

  // Daily Reminder Setting
  const [reminderEnabled, setReminderEnabled] = useState(() => {
    return localStorage.getItem('reminder_enabled') === 'true';
  });

  const changeFontSize = (size: 'normal' | 'large' | 'xl') => {
    setFontSizeState(size);
    localStorage.setItem('font_size', size);
    applyFontSize(size);
  };

  const applyFontSize = (size: 'normal' | 'large' | 'xl') => {
    const root = document.documentElement;
    if (size === 'normal') {
      root.style.fontSize = '16px';
    } else if (size === 'large') {
      root.style.fontSize = '19px';
    } else if (size === 'xl') {
      root.style.fontSize = '22px';
    }
  };

  // Apply on mount
  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  const toggleReminder = () => {
    const newVal = !reminderEnabled;
    setReminderEnabled(newVal);
    localStorage.setItem('reminder_enabled', String(newVal));
    if (newVal) {
      toast.success('Daily recitation reminders enabled!');
    } else {
      toast.success('Reminders disabled.');
    }
  };

  // Queries
  const { data: goals, isLoading: goalsLoading } = useQuery<GoalsData>({
    queryKey: ['goals'],
    queryFn: goalApi.getGoals,
  });

  // Forms
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors, isSubmitting: profileSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' }
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: passwordSubmitting } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const { register: registerGoals, handleSubmit: handleSubmitGoals, reset: resetGoals, formState: { errors: goalsErrors, isSubmitting: goalsSubmitting } } = useForm<GoalsFormValues>({
    resolver: zodResolver(goalsFormSchema),
  });

  // Populate goals form once fetched
  useEffect(() => {
    if (goals) {
      resetGoals({
        dailyGoal: goals.dailyGoal,
        weeklyGoal: goals.weeklyGoal,
        monthlyGoal: goals.monthlyGoal,
      });
    }
  }, [goals, resetGoals]);

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      updateProfileState(data);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  // Silent settings sync mutation
  const syncSettingsMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      updateProfileState(data);
    },
    onError: (error: any) => {
      console.warn('Failed to sync settings:', error);
    }
  });

  // Password Change Mutation
  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      resetPassword({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      toast.success('Password updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  });

  // Goals Update Mutation
  const updateGoalsMutation = useMutation({
    mutationFn: goalApi.updateGoals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      toast.success('Recitation goals updated');
    },
    onError: () => {
      toast.error('Failed to update goals');
    }
  });

  // Reset Data Mutation
  const resetDataMutation = useMutation({
    mutationFn: async () => {
      // Fetch all to find ids, then delete or import empty
      const recitations = await recitationApi.exportRecitations();
      for (const rec of recitations) {
        await recitationApi.deleteRecitation(rec._id);
      }
      // Also delete all counters
      const counters = await counterApi.getCounters();
      for (const counter of counters) {
        await counterApi.deleteCounter(counter._id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recitations'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['recentRecitations'] });
      queryClient.invalidateQueries({ queryKey: ['counters'] });
      setShowResetModal(false);
      toast.success('All recitation history and counters have been reset.');
    },
    onError: () => {
      toast.error('Failed to reset history.');
    }
  });

  // Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      setShowDeleteModal(false);
      logout();
    },
    onError: () => {
      toast.error('Failed to delete account.');
    }
  });

  const handleConfirmReset = async () => {
    if (!resetPasswordInput.trim()) {
      toast.error('Please enter your password to confirm reset');
      return;
    }
    setIsVerifyingPassword(true);
    try {
      const isValid = await authApi.verifyPassword(resetPasswordInput);
      if (isValid) {
        resetDataMutation.mutate();
        setResetPasswordInput('');
      } else {
        toast.error('Incorrect password');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password verification failed');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletePasswordInput.trim()) {
      toast.error('Please enter your password to confirm delete');
      return;
    }
    setIsVerifyingPassword(true);
    try {
      const isValid = await authApi.verifyPassword(deletePasswordInput);
      if (isValid) {
        deleteAccountMutation.mutate();
        setDeletePasswordInput('');
      } else {
        toast.error('Incorrect password');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password verification failed');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const onUpdateProfile = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (user) {
      syncSettingsMutation.mutate({ theme: newTheme });
    }
  };

  const handleLanguageChange = (newLang: 'en' | 'ur_roman' | 'ur') => {
    setLanguage(newLang);
    if (user) {
      syncSettingsMutation.mutate({ language: newLang });
    }
  };

  const onChangePassword = (values: PasswordFormValues) => {
    changePasswordMutation.mutate({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });
  };

  const onUpdateGoals = (values: GoalsFormValues) => {
    updateGoalsMutation.mutate(values);
  };

  // Data Export JSON
  const handleExportJSON = async () => {
    try {
      const recitations = await recitationApi.exportRecitations();
      const counters = await counterApi.getCounters();
      const backup = { recitations, counters };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `al_kitab_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast.success('Backup exported as JSON');
    } catch {
      toast.error('Failed to export JSON backup');
    }
  };

  // Data Export CSV
  const handleExportCSV = async () => {
    try {
      const records = await recitationApi.exportRecitations();
      let csvContent = 'Date,Surah Number,Surah Name,Type,From Ayah,To Ayah,Ayah Count,Notes\n';
      records.forEach(r => {
        const notes = r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '';
        csvContent += `${new Date(r.date).toISOString().split('T')[0]},${r.surahNumber},"${r.surahName}",${r.type},${r.fromAyah || ''},${r.toAyah || ''},${r.ayahCount},${notes}\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `al_kitab_history_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('History exported as CSV');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  // Print PDF Trigger
  const handlePrintPDF = () => {
    window.print();
  };

  // Import JSON Backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let recitationsToImport = [];
        let countersToImport = [];

        if (Array.isArray(parsed)) {
          // Legacy format (only recitation array)
          recitationsToImport = parsed;
        } else if (parsed && typeof parsed === 'object') {
          // New format
          recitationsToImport = parsed.recitations || [];
          countersToImport = parsed.counters || [];
        } else {
          throw new Error('Invalid backup file structure');
        }

        // Import recitations
        await recitationApi.importRecitations(recitationsToImport);

        // Import counters
        if (countersToImport.length > 0) {
          for (const c of countersToImport) {
            const newCounter = await counterApi.createCounter({
              name: c.name,
              surahNumber: c.surahNumber,
              initialCount: c.initialCount,
              initialDate: c.initialDate,
              notes: c.notes
            });
            // Import logs
            if (c.logs && c.logs.length > 0) {
              for (const log of c.logs) {
                await counterApi.addLog(newCounter._id, {
                  count: log.count,
                  date: log.date,
                  notes: log.notes
                });
              }
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ['recitations'] });
        queryClient.invalidateQueries({ queryKey: ['statistics'] });
        queryClient.invalidateQueries({ queryKey: ['counters'] });
        toast.success('Backup restored successfully!');
      } catch {
        toast.error('Failed to import backup. Please check file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 font-normal">



      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-normal">
        {/* Settings Navigation Tabs */}
        <div className="md:col-span-1 flex md:flex-col gap-1.5 p-1.5 rounded-2xl bg-white/40 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 overflow-x-auto md:overflow-x-visible scrollbar-none h-fit">
          {(['general', 'goals', 'account', 'backup'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSettingsTab(tab)}
              className={`flex-1 md:flex-initial py-2 px-3 rounded-xl text-xs font-normal transition-all cursor-pointer flex items-center justify-center md:justify-start space-x-2 font-outfit whitespace-nowrap ${
                activeSettingsTab === tab
                  ? 'bg-amber-800 text-white shadow-xs font-normal'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              {tab === 'general' && <><SettingsIcon className="w-4 h-4 shrink-0" /><span>General</span></>}
              {tab === 'goals' && <><Target className="w-4 h-4 shrink-0" /><span>Goals</span></>}
              {tab === 'account' && <><User className="w-4 h-4 shrink-0" /><span>Account</span></>}
              {tab === 'backup' && <><Database className="w-4 h-4 shrink-0" /><span>Backup</span></>}
            </button>
          ))}
        </div>

        {/* Tabs Content */}
        <div className="md:col-span-3">
          {activeSettingsTab === 'general' && (
            <div className="space-y-6 animate-fadeIn">
          {/* 1. Theme Configuration */}
          <div className="dashboard-card p-5 space-y-3.5 text-left">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>{t('settings.theme')}</span>
            </h3>
            <div className="grid grid-cols-3 gap-2 bg-slate-50/50 dark:bg-slate-900/40 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`py-2 px-3 rounded-xl text-xs font-normal flex items-center justify-center space-x-1 transition-all cursor-pointer font-outfit ${
                  theme === 'light'
                    ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t('settings.themeLight')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`py-2 px-3 rounded-xl text-xs font-normal flex items-center justify-center space-x-1 transition-all cursor-pointer font-outfit ${
                  theme === 'dark'
                    ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t('settings.themeDark')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`py-2 px-3 rounded-xl text-xs font-normal flex items-center justify-center space-x-1 transition-all cursor-pointer font-outfit ${
                  theme === 'system'
                    ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{t('settings.themeSystem')}</span>
              </button>
            </div>
          </div>

          {/* 1.5 Language Configuration */}
          <div className="dashboard-card p-5 space-y-3.5 text-left">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
              <Type className="w-4 h-4 text-amber-600" />
              <span>{t('settings.language')}</span>
            </h3>
            <div className="grid grid-cols-3 gap-2 bg-slate-50/50 dark:bg-slate-900/40 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`py-2 px-3 rounded-xl text-xs font-normal flex items-center justify-center space-x-1 transition-all cursor-pointer font-outfit ${
                  language === 'en'
                    ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span>{t('settings.langEn')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ur_roman')}
                className={`py-2 px-3 rounded-xl text-xs font-normal flex items-center justify-center space-x-1 transition-all cursor-pointer font-outfit ${
                  language === 'ur_roman'
                    ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span>{t('settings.langUrRoman')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ur')}
                className={`py-2 px-3 rounded-xl text-xs font-normal flex items-center justify-center space-x-1 transition-all cursor-pointer font-outfit ${
                  language === 'ur'
                    ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span>{t('settings.langUr')}</span>
              </button>
            </div>
          </div>

          {/* 2. Accessibility: Font Size Adjustment */}
          <div className="dashboard-card p-5 space-y-3.5 text-left">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
              <Type className="w-4 h-4 text-amber-600" />
              <span>{t('settings.textSizeTitle')}</span>
            </h3>
            <p className="text-4xs text-slate-400 font-normal">
              {t('settings.textSizeDesc')}
            </p>
            <div className="grid grid-cols-3 gap-2 bg-slate-50/50 dark:bg-slate-900/40 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => changeFontSize('normal')}
                className={`py-2 px-3 rounded-xl text-xs font-normal transition-all cursor-pointer font-outfit ${
                  fontSize === 'normal'
                    ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {t('settings.textSizeNormal')}
              </button>
              <button
                type="button"
                onClick={() => changeFontSize('large')}
                className={`py-2 px-3 rounded-xl text-xs font-normal transition-all cursor-pointer font-outfit ${
                  fontSize === 'large'
                    ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {t('settings.textSizeLarge')}
              </button>
              <button
                type="button"
                onClick={() => changeFontSize('xl')}
                className={`py-2 px-3 rounded-xl text-xs font-normal transition-all cursor-pointer font-outfit ${
                  fontSize === 'xl'
                    ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {t('settings.textSizeXl')}
              </button>
            </div>
          </div>

          {/* 3. Daily Reminders */}
          <div className="dashboard-card p-5 text-left flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>{t('settings.reminderTitle')}</span>
              </h3>
              <p className="text-4xs text-slate-400 font-normal">
                {t('settings.reminderDesc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={toggleReminder}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-800"></div>
            </label>
          </div>
        </div>
      )}

      {activeSettingsTab === 'goals' && (
        <div className="space-y-4 animate-fadeIn">
          {/* 4. Recitation Goals Setup */}
          <div className="dashboard-card p-5 text-left space-y-4 font-normal">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
              <Target className="w-4 h-4 text-amber-600" />
              <span>{t('settings.goalsTitle')}</span>
            </h3>

            {goalsLoading ? (
              <p className="text-xs text-slate-400">{t('buttons.loading')}</p>
            ) : (
              <form onSubmit={handleSubmitGoals(onUpdateGoals)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                      {t('settings.goalsDaily')}
                    </label>
                    <input
                      type="number"
                      {...registerGoals('dailyGoal', { valueAsNumber: true })}
                      className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal text-center focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                    />
                    {goalsErrors.dailyGoal && (
                      <p className="mt-1 text-4xs text-red-500">{goalsErrors.dailyGoal.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                      {t('settings.goalsWeekly')}
                    </label>
                    <input
                      type="number"
                      {...registerGoals('weeklyGoal', { valueAsNumber: true })}
                      className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal text-center focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                    />
                    {goalsErrors.weeklyGoal && (
                      <p className="mt-1 text-4xs text-red-500">{goalsErrors.weeklyGoal.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                      {t('settings.goalsMonthly')}
                    </label>
                    <input
                      type="number"
                      {...registerGoals('monthlyGoal', { valueAsNumber: true })}
                      className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal text-center focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                    />
                    {goalsErrors.monthlyGoal && (
                      <p className="mt-1 text-4xs text-red-500">{goalsErrors.monthlyGoal.message}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={goalsSubmitting}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-xl text-xs font-normal text-white bg-amber-800 hover:bg-amber-900 transition-all cursor-pointer shadow-xs font-outfit"
                >
                  {goalsSubmitting ? t('settings.goalsSaving') : t('settings.goalsSave')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {activeSettingsTab === 'account' && (
        <div className="space-y-4 animate-fadeIn">
          {/* 5. Profile Update */}
          <div className="dashboard-card p-5 text-left space-y-4 font-normal">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
              <User className="w-4 h-4 text-amber-600" />
              <span>{t('settings.profileTitle')}</span>
            </h3>

            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
              <div>
                <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                  {t('settings.profileName')}
                </label>
                <input
                  type="text"
                  {...registerProfile('name')}
                  className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
                {profileErrors.name && (
                  <p className="mt-1 text-4xs text-red-500">{profileErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                  {t('settings.profileEmail')}
                </label>
                <input
                  type="email"
                  {...registerProfile('email')}
                  className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
                {profileErrors.email && (
                  <p className="mt-1 text-4xs text-red-500">{profileErrors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full flex justify-center items-center py-2 px-4 rounded-xl text-xs font-normal text-white bg-amber-800 hover:bg-amber-900 transition-all cursor-pointer shadow-xs font-outfit"
              >
                {profileSubmitting ? t('settings.profileSaving') : t('settings.profileSave')}
              </button>
            </form>
          </div>

          {/* 6. Password Update */}
          <div className="dashboard-card p-5 text-left space-y-4 font-normal">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>{t('settings.pwdTitle')}</span>
            </h3>

            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
              <div>
                <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                  {t('settings.pwdOld')}
                </label>
                <input
                  type="password"
                  {...registerPassword('oldPassword')}
                  placeholder="••••••••"
                  className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
                {passwordErrors.oldPassword && (
                  <p className="mt-1 text-4xs text-red-500">{passwordErrors.oldPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                  {t('settings.pwdNew')}
                </label>
                <input
                  type="password"
                  {...registerPassword('newPassword')}
                  placeholder="••••••••"
                  className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-4xs text-red-500">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                  {t('settings.pwdConfirm')}
                </label>
                <input
                  type="password"
                  {...registerPassword('confirmNewPassword')}
                  placeholder="••••••••"
                  className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                />
                {passwordErrors.confirmNewPassword && (
                  <p className="mt-1 text-4xs text-red-500">{passwordErrors.confirmNewPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={passwordSubmitting}
                className="w-full flex justify-center items-center py-2 px-4 rounded-xl text-xs font-normal text-white bg-amber-800 hover:bg-amber-900 transition-all cursor-pointer shadow-xs font-outfit"
              >
                {passwordSubmitting ? t('settings.pwdSaving') : t('settings.pwdSave')}
              </button>
            </form>
          </div>

          {/* 8. Danger Zone */}
          <div className="dashboard-card p-5 border-red-200 dark:border-red-900/40 text-left space-y-4 font-normal">
            <h3 className="font-outfit font-normal text-red-600 dark:text-red-400 text-sm flex items-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>{t('settings.dangerTitle')}</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setShowResetModal(true)}
                className="w-full py-2 px-4 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-xs font-normal flex items-center justify-center space-x-1.5 cursor-pointer transition-colors font-outfit"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('settings.dangerReset')}</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-normal flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shadow-xs font-outfit"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('settings.dangerDelete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSettingsTab === 'backup' && (
        <div className="space-y-4 animate-fadeIn">
          {/* 7. Backup and Restore */}
          <div className="dashboard-card p-5 text-left space-y-4 font-normal">
            <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
              <Download className="w-4 h-4 text-amber-600" />
              <span>{t('settings.backupTitle')}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="py-2 px-3 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5 cursor-pointer transition-all border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 hover:bg-slate-50 font-outfit"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('settings.backupExportJson')}</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="py-2 px-3 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5 cursor-pointer transition-all border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 hover:bg-slate-50 font-outfit"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('settings.backupExportCsv')}</span>
              </button>
            </div>

            <button
              onClick={handlePrintPDF}
              className="w-full py-2 px-4 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5 cursor-pointer transition-all border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 hover:bg-slate-50 font-outfit"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('settings.backupPrint')}</span>
            </button>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-2">
                {t('settings.backupRestoreLabel')}
              </label>
              <div className="relative flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 hover:border-amber-500 cursor-pointer transition-colors bg-white/20 dark:bg-slate-900/20">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center space-y-1 pointer-events-none">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-4xs text-slate-400 font-normal">{t('settings.backupRestoreSelect')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Reset Data Confirmation Modal */}
      {showResetModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="dashboard-card max-w-sm w-full p-5 space-y-4 text-center font-normal my-auto">
            <div className="w-10 h-10 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-200 dark:border-red-900/30">
              <RefreshCw className="w-5 h-5" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm">{t('settings.resetModalTitle')}</h3>
              <p className="text-4xs text-slate-400 max-w-[240px] mx-auto font-normal">
                {t('settings.resetModalDesc')}
              </p>
            </div>

            <div className="text-left space-y-1">
              <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-red-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowResetModal(false); setResetPasswordInput(''); }}
                className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-normal text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-outfit"
              >
                {t('settings.btnCancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetDataMutation.isPending || isVerifyingPassword}
                className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-normal text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50 font-outfit"
              >
                {resetDataMutation.isPending || isVerifyingPassword ? t('settings.btnResetting') : t('settings.btnReset')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="dashboard-card max-w-sm w-full p-5 space-y-4 text-center font-normal my-auto">
            <div className="w-10 h-10 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-200 dark:border-red-900/30">
              <Trash2 className="w-5 h-5" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-outfit font-normal text-slate-800 dark:text-slate-100 text-sm">{t('settings.deleteModalTitle')}</h3>
              <p className="text-4xs text-slate-400 max-w-[240px] mx-auto font-normal">
                {t('settings.deleteModalDesc')}
              </p>
            </div>

            <div className="text-left space-y-1">
              <label className="block text-4xs font-normal text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={deletePasswordInput}
                onChange={(e) => setDeletePasswordInput(e.target.value)}
                className="block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-red-500 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeletePasswordInput(''); }}
                className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-normal text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-outfit"
              >
                {t('settings.btnCancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteAccountMutation.isPending || isVerifyingPassword}
                className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-normal text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50 font-outfit"
              >
                {deleteAccountMutation.isPending || isVerifyingPassword ? t('settings.btnDeleting') : t('settings.btnDelete')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
