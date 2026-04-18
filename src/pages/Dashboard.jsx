import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioCtx as usePortfolio } from '../contexts/PortfolioContext';
import { calcPortfolioSummary, fmtKRW, fmtPct, summarizeByAssetGroup, toYahooSymbol } from '../utils/calculations';
import StockCard from '../components/StockCard';
import AllocationPieChart from '../components/AllocationPieChart';
import PLBarChart from '../components/PLBarChart';
import PortfolioLineChart from '../components/PortfolioLineChart';
import AverageCostReturnChart from '../components/AverageCostReturnChart';
import AssetGroupOverview from '../components/AssetGroupOverview';
import { AssetGroupAllocationChart, AssetGroupPLChart } from '../components/AssetGroupCharts';
import AssetGroupRealizedChart from '../components/AssetGroupRealizedChart';
import AssetGroupProfitTrendChart from '../components/AssetGroupProfitTrendChart';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { stocks, prices, loading } = usePortfolio();
  const navigate = useNavigate();
  const [showProfitTrend, setShowProfitTrend] = useState(false);

  const { enriched, totalInvested, totalValue, totalPL, totalPlPct, totalRealizedPL, totalCombinedPL } =
    calcPortfolioSummary(stocks, prices);
  const assetGroups = summarizeByAssetGroup(enriched);

  const isProfit = totalPL >= 0;
  const isRealizedProfit = totalRealizedPL >= 0;

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

  return (
    <div className="page-inner">
      {/* 헤더 */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-0.5">안녕하세요</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">내 포트폴리오</h1>
      </div>

      {stocks.length === 0 ? (
        <EmptyState navigate={navigate} />
      ) : (
        <>
          {/* 총 자산 히어로 카드 */}
          <div className="dashboard-grid-full mb-4">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1d4ed8 100%)' }}
            >
              <button
                type="button"
                onClick={() => setShowProfitTrend((prev) => !prev)}
                className="w-full text-left border-none cursor-pointer bg-transparent p-0"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>총 평가금액</p>
                      <p className="text-[34px] font-bold text-white leading-none tracking-tight">
                        {fmtKRW(totalValue)}
                      </p>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold',
                      isProfit
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    )}>
                      {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {fmtPct(totalPlPct)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                    <HeroStat label="총 투자금액" value={fmtKRW(totalInvested)} />
                    <HeroStat label="평가손익" value={(totalPL >= 0 ? '+' : '') + fmtKRW(totalPL)} highlight={isProfit} />
                    <HeroStat label="실현손익" value={(totalRealizedPL >= 0 ? '+' : '') + fmtKRW(totalRealizedPL)} highlight={isRealizedProfit} />
                    <HeroStat label="총 누적손익" value={(totalCombinedPL >= 0 ? '+' : '') + fmtKRW(totalCombinedPL)} highlight={totalCombinedPL >= 0} />
                  </div>

                  <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {showProfitTrend ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span className="text-[12px]">수익 추이 {showProfitTrend ? '숨기기' : '보기'}</span>
                  </div>
                </div>
              </button>

              {showProfitTrend && (
                <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="px-1 pb-2">
                    <AssetGroupProfitTrendChart enrichedStocks={enriched} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 차트 섹션 */}
          <div className="dashboard-grid mb-0">
            <div className="dashboard-grid-full">
              <PortfolioLineChart enrichedStocks={enriched} />
            </div>
            <div className="dashboard-grid-full">
              <AverageCostReturnChart enrichedStocks={enriched} />
            </div>
            <div className="dashboard-grid-full">
              <AssetGroupOverview groups={assetGroups} />
            </div>
            <div className="dashboard-grid-full">
              <AssetGroupRealizedChart enrichedStocks={enriched} />
            </div>
            <AssetGroupAllocationChart groups={assetGroups} />
            <AssetGroupPLChart groups={assetGroups} />
            <AllocationPieChart enrichedStocks={enriched} />
            <PLBarChart enrichedStocks={enriched} />
          </div>

          {/* 종목 현황 */}
          <div className="flex items-center gap-2 mt-6 mb-3">
            <h2 className="text-[17px] font-bold text-foreground">종목 현황</h2>
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {enriched.length}개
            </span>
          </div>
          <div className="stock-card-grid">
            {enriched.map((stock) => {
              const yahoo = toYahooSymbol(stock.symbol, stock.market);
              return (
                <StockCard
                  key={stock.id}
                  stock={stock}
                  currentPrice={prices[yahoo]?.price ?? stock.currentPrice}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function HeroStat({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[11px] mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
      <p className="text-[15px] font-semibold" style={{
        color: highlight === undefined
          ? 'white'
          : highlight ? '#6ee7b7' : '#fca5a5',
      }}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center text-center py-20 px-5">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary mb-5">
        <Briefcase size={36} strokeWidth={1.5} className="text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">아직 종목이 없어요</h2>
      <p className="text-[14px] text-muted-foreground mb-8">
        포트폴리오 탭에서 종목을 추가해 보세요!
      </p>
      <button
        className="btn-primary"
        onClick={() => navigate('/portfolio')}
        style={{ maxWidth: 220 }}
      >
        종목 추가하러 가기
      </button>
    </div>
  );
}
