import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { Mail, Lock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext.tsx';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    }
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
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
          {t('auth.loginDesc')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="dashboard-card p-6 text-left space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-4xs font-normal text-slate-400 uppercase tracking-wider mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
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
                  autoComplete="current-password"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs font-normal">
              <label className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 border border-slate-300 dark:border-slate-700 rounded-md peer-checked:bg-amber-800 peer-checked:border-amber-800 flex items-center justify-center transition-all">
                  <Check className="w-3 h-3 text-white stroke-[3px] opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="ml-2 text-4xs font-normal text-slate-400 select-none">
                  {t('auth.rememberMe')}
                </span>
              </label>

              <div className="text-4xs">
                <Link
                  to="#"
                  onClick={() => toast('Forgot password architectural pattern is configured. Enter credentials to login.', { icon: 'ℹ️' })}
                  className="font-normal text-amber-800 dark:text-amber-400 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
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
                  t('auth.signIn')
                )}
              </button>
            </div>
          </form>

          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
            <p className="text-4xs text-slate-400 font-normal">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="font-normal text-amber-800 dark:text-amber-400 hover:underline">
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
