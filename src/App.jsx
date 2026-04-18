import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { BottomNav, Sidebar, RefreshFAB } from './components/BottomNav';
import InstallPrompt from './components/InstallPrompt';
import { TrendingUp } from 'lucide-react';

const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Portfolio   = lazy(() => import('./pages/Portfolio'));
const StockDetail = lazy(() => import('./pages/StockDetail'));
const Settings    = lazy(() => import('./pages/Settings'));
const Login       = lazy(() => import('./pages/Login'));

function AuthenticatedApp() {
  return (
    <PortfolioProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <InstallPrompt />
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/stock/:id" element={<StockDetail />} />
              <Route path="/settings"  element={<Settings />} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <RefreshFAB />
        <BottomNav />
      </div>
    </PortfolioProvider>
  );
}

function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-[60dvh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
          style={{ animation: 'spin 0.7s linear infinite' }} />
        <span className="text-sm text-muted-foreground">불러오는 중…</span>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <TrendingUp size={28} strokeWidth={2.5} color="white" />
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent"
            style={{ animation: 'spin 0.7s linear infinite' }} />
        </div>
      </div>
    );
  }

  return user
    ? <AuthenticatedApp />
    : <><InstallPrompt /><Suspense fallback={null}><Login /></Suspense></>;
}
