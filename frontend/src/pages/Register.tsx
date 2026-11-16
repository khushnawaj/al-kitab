import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { User, Mail, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useTheme } from '../contexts/ThemeContext.js';

const registerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const Register: React.FC = () => {
  const { register: authRegister, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await authRegister({
        name: values.name,
        email: values.email,
        password: values.password,
        language,
        theme,
      });
      navigate('/', { replace: true });
    } catch {
      // toast is already handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#07140e] relative overflow-hidden transition-colors duration-200 font-normal">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 space-y-2">
        <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-white font-normal text-2xl bg-amber-800 shadow-xs font-outfit">
          ك
        </div>
        <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 tracking-tight font-outfit">
          al-kitab.
        </h2>
        <p className="text-xs text-slate-400 font-normal">
          {t('auth.registerDesc')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="dashboard-card p-6 text-left space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                {t('auth.fullName')}
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className={`block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal placeholder-slate-400/60 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border ${
                    errors.name 
                      ? 'border-red-500' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder="John Doe"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              {errors.name && (
                <p className="mt-1 text-4xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal placeholder-slate-400/60 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border ${
                    errors.email 
                      ? 'border-red-500' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder="name@example.com"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              {errors.email && (
                <p className="mt-1 text-4xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className={`block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal placeholder-slate-400/60 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border ${
                    errors.password 
                      ? 'border-red-500' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-4xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  className={`block w-full px-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-normal placeholder-slate-400/60 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/50 dark:bg-slate-900/50 border ${
                    errors.confirmPassword 
                      ? 'border-red-500' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-4xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center px-4 py-2 rounded-xl text-xs font-normal text-white bg-amber-800 hover:bg-amber-900 focus:outline-none disabled:opacity-50 transition-all cursor-pointer shadow-xs font-outfit"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('auth.registerTitle')
                )}
              </button>
            </div>
          </form>

          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
            <p className="text-4xs text-slate-400 font-normal">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="font-normal text-amber-800 dark:text-amber-400 hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
