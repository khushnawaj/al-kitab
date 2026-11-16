
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './contexts/AuthContext.js';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { LanguageProvider } from './contexts/LanguageContext.js';

// Layouts & Protected Route
import { AppLayout } from './layouts/AppLayout.js';
import { ProtectedRoute } from './components/common/ProtectedRoute.js';

// Pages
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { Dashboard } from './pages/Dashboard.js';
import { RecitationForm } from './pages/RecitationForm.js';
import { History } from './pages/History.js';
import { Calendar } from './pages/Calendar.js';
import { Settings } from './pages/Settings.js';
import { Counters } from './pages/Counters.js';
import { Profile } from './pages/Profile.js';
import { AdminPanel } from './pages/AdminPanel.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    borderRadius: '14px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    padding: '10px 14px',
                    maxWidth: '340px',
                  },
                  className: 'toast-adaptive',
                  success: {
                    style: {
                      background: '#f0fdf4',
                      color: '#14532d',
                      border: '1px solid #bbf7d0',
                    },
                    iconTheme: {
                      primary: '#16a34a',
                      secondary: '#ffffff',
                    },
                  },
                  error: {
                    style: {
                      background: '#fef2f2',
                      color: '#7f1d1d',
                      border: '1px solid #fecaca',
                    },
                    iconTheme: {
                      primary: '#dc2626',
                      secondary: '#ffffff',
                    },
                  },
                }}
              />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected App Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <RecitationForm />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <RecitationForm />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <History />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Calendar />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Settings />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Profile />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AdminPanel />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/counters"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Counters />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
