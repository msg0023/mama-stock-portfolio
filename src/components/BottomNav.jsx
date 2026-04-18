import { NavLink, useLocation } from 'react-router-dom';
import { usePortfolioCtx } from '../contexts/PortfolioContext';
import { LayoutDashboard, Briefcase, Settings, RefreshCw, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

const tabs = [
  { to: '/',          Icon: LayoutDashboard, label: '홈' },
  { to: '/portfolio', Icon: Briefcase,        label: '포트폴리오' },
  { to: '/settings',  Icon: Settings,         label: '설정' },
];

/* ── 모바일 하단 탭 ── */
export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 no-underline text-[11px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                isActive ? 'bg-primary/10' : ''
              )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/* ── 모바일 플로팅 새로고침 버튼 ── */
export function RefreshFAB() {
  const { fetchPrices, priceLoading, stocks } = usePortfolioCtx();
  if (!stocks.length) return null;

  return (
    <button
      onClick={fetchPrices}
      disabled={priceLoading}
      className="refresh-fab"
      title="현재가 새로고침"
    >
      <RefreshCw
        size={20}
        strokeWidth={2.2}
        style={{
          display: 'inline-block',
          animation: priceLoading ? 'spin 0.8s linear infinite' : 'none',
        }}
      />
    </button>
  );
}

/* ── 데스크탑 사이드바 ── */
export function Sidebar() {
  const location = useLocation();
  const { fetchPrices, priceLoading, stocks } = usePortfolioCtx();

  return (
    <aside className="sidebar">
      {/* 로고 */}
      <div className="flex items-center gap-3 mb-8 px-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white">
          <TrendingUp size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[14px] font-bold text-foreground leading-tight">내 포트폴리오</div>
          <div className="text-[11px] text-muted-foreground">주식 관리</div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-border mb-4" />

      {/* 메뉴 */}
      <nav className="flex-1 space-y-1">
        {tabs.map(({ to, Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline text-[14px] font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              {label}
            </NavLink>
          );
        })}

        {/* 현재가 새로고침 */}
        {stocks.length > 0 && (
          <button
            onClick={fetchPrices}
            disabled={priceLoading}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border-none',
              'text-[14px] font-medium font-sans cursor-pointer transition-all mt-2',
              priceLoading
                ? 'text-muted-foreground bg-muted cursor-not-allowed'
                : 'text-primary bg-primary/8 hover:bg-primary/15'
            )}
          >
            <RefreshCw
              size={16}
              strokeWidth={2.2}
              style={{ animation: priceLoading ? 'spin 0.8s linear infinite' : 'none' }}
            />
            {priceLoading ? '조회 중…' : '현재가 새로고침'}
          </button>
        )}
      </nav>

      <div className="text-[11px] text-muted-foreground px-3">v1.0</div>
    </aside>
  );
}

export default BottomNav;
