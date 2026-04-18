import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioCtx as usePortfolio } from '../contexts/PortfolioContext';
import { calcStockStats, fmtKRW, fmtPct, getAssetGroupMeta, getAssetUnit, toYahooSymbol } from '../utils/calculations';
import AddStockModal from '../components/AddStockModal';
import { Plus, TrendingUp, TrendingDown, ChevronRight, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';

const FILTERS = [
  { key: 'ALL',  label: '전체' },
  { key: 'COIN', label: '코인' },
  { key: 'KR',   label: '국내주식' },
  { key: 'US',   label: '미국주식' },
];

export default function Portfolio() {
  const { stocks, prices, loading, addStock } = usePortfolio();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter]   = useState('ALL');
  const navigate = useNavigate();

  const handleAddStock = async (data) => {
    await addStock(data);
    setShowAdd(false);
  };

  if (loading) {
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

  const filteredStocks = stocks.filter((stock) => {
    if (filter === 'ALL') return true;
    return getAssetGroupMeta(stock.market).key === filter;
  });

  return (
    <div className="page-inner">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">포트폴리오</h1>
          {stocks.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{stocks.length}개 자산</p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold bg-primary text-white border-none cursor-pointer transition-all hover:opacity-90 active:scale-95"
          style={{ fontFamily: 'inherit' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          자산 추가
        </button>
      </div>

      {/* 필터 */}
      <div className="segmented-control mb-5">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cn('segmented-control__button', filter === item.key && 'is-active')}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {stocks.length === 0 ? (
        <EmptyState onAdd={() => setShowAdd(true)} />
      ) : filteredStocks.length === 0 ? (
        <div className="flex flex-col items-center text-center py-14 px-5">
          <div className="text-4xl mb-3">🗂️</div>
          <p className="text-[14px] text-muted-foreground">
            선택한 자산군에 아직 종목이 없어요.
          </p>
        </div>
      ) : (
        <div className="portfolio-list-grid">
          {filteredStocks.map((stock) => {
            const yahoo    = toYahooSymbol(stock.symbol, stock.market);
            const cp       = prices[yahoo]?.price ?? stock.currentPrice;
            const stats    = calcStockStats(stock.transactions, cp);
            const unitLabel = getAssetUnit(stock.market);
            const isProfit = stats.pl > 0;
            const isLoss   = stats.pl < 0;
            const groupMeta = getAssetGroupMeta(stock.market);

            return (
              <div
                key={stock.id}
                className="card fade-up mb-3 cursor-pointer transition-all hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]"
                onClick={() => navigate(`/stock/${stock.id}`)}
              >
                <div className="flex items-center gap-3">
                  {/* 색상 아이콘 */}
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
                    style={{ background: stock.color + '18' }}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ background: stock.color }} />
                  </div>

                  {/* 이름 + 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[15px] font-bold text-foreground truncate">{stock.name}</span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: groupMeta.color + '18', color: groupMeta.color }}
                      >
                        {groupMeta.label}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      {stock.symbol} · {stock.broker} · {stats.totalQty.toLocaleString()}{unitLabel}
                    </p>
                  </div>

                  {/* 수익률 */}
                  <div className="text-right flex-shrink-0">
                    <div className={cn(
                      'flex items-center justify-end gap-1 text-[14px] font-bold',
                      isProfit ? 'text-emerald-600' : isLoss ? 'text-red-500' : 'text-slate-500'
                    )}>
                      {isProfit ? <TrendingUp size={13} /> : isLoss ? <TrendingDown size={13} /> : null}
                      {fmtPct(stats.plPct)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {stats.pl >= 0 ? '+' : ''}{fmtKRW(stats.pl)}
                    </p>
                  </div>

                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddStockModal
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddStock}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center text-center py-20 px-5">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary mb-5">
        <Briefcase size={36} strokeWidth={1.5} className="text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">자산을 추가해보세요</h2>
      <p className="text-[14px] text-muted-foreground mb-8">
        주식, 코인, ETF 등 모든 자산을<br />한 곳에서 관리할 수 있어요.
      </p>
      <button
        className="btn-primary"
        onClick={onAdd}
        style={{ maxWidth: 200 }}
      >
        첫 번째 자산 추가
      </button>
    </div>
  );
}
