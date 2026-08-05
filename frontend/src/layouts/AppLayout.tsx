import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useLanguage } from '../contexts/LanguageContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import {
  BookOpenCheck,
  CalendarDays,
  History,
  LayoutDashboard,
  Plus,
  Settings,
  Shield,
  User,
  Menu,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';

type NavItem = { path: string; label: string; shortLabel: string; icon: React.ElementType };

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/', label: t('navigation.dashboard'), shortLabel: 'Overview', icon: LayoutDashboard },
    { path: '/counters', label: t('navigation.counters'), shortLabel: 'Registers', icon: BookOpenCheck },
    { path: '/calendar', label: t('navigation.calendar'), shortLabel: 'Calendar', icon: CalendarDays },
    { path: '/history', label: 'History', shortLabel: 'History', icon: History },
    { path: '/profile', label: 'Profile', shortLabel: 'Profile', icon: User },
    { path: '/settings', label: t('navigation.settings'), shortLabel: 'Settings', icon: Settings },
  ];

  const current = navItems.find((item) => item.path === location.pathname);
  const page = location.pathname === '/add' ? { title: 'Add recitation', subtitle: 'Record what you read today', icon: Plus }
    : location.pathname.startsWith('/edit') ? { title: 'Edit recitation', subtitle: 'Update your reading record', icon: Plus }
    : location.pathname === '/admin' ? { title: 'Administration', subtitle: 'Manage the Al-Kitab community', icon: Shield }
    : { title: current?.label || t('navigation.dashboard'), subtitle: current?.path === '/' ? 'Your reading practice, at a glance' : 'Keep your reading journey organized', icon: current?.icon || LayoutDashboard };

  const PageIcon = page.icon;
  const { theme, setTheme } = useTheme();
  const [showMobileNav, setShowMobileNav] = useState(false);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else setTheme('light');
  };

  const toggleMobileNav = () => setShowMobileNav(!showMobileNav);
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-shell min-h-screen">
      <div className="app-main">
        {/* ── REDESIGNED NAVBAR MATCHING REFERENCE DESIGN ── */}
        <header className="app-topbar sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800">
          
          {/* Left: Brand Logo & Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2 font-outfit text-lg font-light tracking-tight text-slate-800 dark:text-white">
              <span className="w-8 h-8 rounded-xl bg-amber-800 dark:bg-amber-600 text-white flex items-center justify-center font-serif text-sm shadow-xs">
                ك
              </span>
              <span>
                al-<span className="text-amber-700 dark:text-amber-400 font-normal">kitab.</span>
              </span>
            </Link>

            {/* Mobile Hamburger */}
            <button className="mobile-menu-toggle lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={toggleMobileNav} aria-label="Toggle navigation">
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-slate-200/60 dark:border-slate-800">
              {navItems.map(({ path, label, shortLabel, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-1.5 rounded-xl font-outfit text-xs font-normal transition-all flex items-center space-x-1.5 ${
                    isActive(path)
                      ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{shortLabel || label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions & User Chip */}
          <div className="flex items-center space-x-2">
            {/* Theme Switcher */}
            <button
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              <Sun className={theme === 'light' ? 'w-4 h-4 text-amber-600' : 'hidden'} />
              <Moon className={theme === 'dark' ? 'w-4 h-4 text-amber-400' : 'hidden'} />
            </button>

            {/* User Profile Chip */}
            <Link
              to="/profile"
              className="flex items-center space-x-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-amber-300/40" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-normal text-xs font-outfit flex items-center justify-center border border-amber-300/40">
                  {user?.name?.charAt(0).toUpperCase() || 'K'}
                </div>
              )}
              <span className="hidden sm:inline-block font-outfit text-xs font-normal text-slate-700 dark:text-slate-200 capitalize">
                {user?.name?.split(' ')[0] || 'khush'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </Link>
          </div>

        </header>

        {/* Main Content Body */}
        <main className="app-content">
          {location.pathname !== '/' && (
            <section className="page-heading mb-6 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 flex items-center justify-center font-normal shrink-0">
                <PageIcon className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-outfit text-xl font-normal text-slate-800 dark:text-slate-100 tracking-tight">{page.title}</h1>
                <p className="text-4xs font-normal text-slate-400">{page.subtitle}</p>
              </div>
            </section>
          )}
          <section className="page-canvas">{children}</section>
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      {showMobileNav && (
        <nav className="mobile-nav lg:hidden" aria-label="Primary navigation">
          {navItems.slice(0, 5).map(({ path, shortLabel, icon: Icon }) => (
            <Link key={path} to={path} className={isActive(path) ? 'is-active' : ''}>
              <Icon />
              <span>{shortLabel}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};
