import { useNavigate } from 'react-router-dom';
import { calcStockStats, fmtPct, fmtPrice, getAssetGroupMeta, getAssetUnit } from '../utils/calculations';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StockCard({ stock, currentPrice }) {
  const navigate = useNavigate();
  const currency = stock.currentCurrency || 'KRW';
  const unitLabel = getAssetUnit(stock.market);
  const groupMeta = getAssetGroupMeta(stock.market);
  const stats = calcStockStats(stock.transactions, currentPrice ?? stock.currentPrice);
  const { totalQty, avgPrice, currentValue, pl, realizedPL, plPct } = stats;
  const isProfit = pl > 0;
  const isLoss = pl < 0;
  const plColor = isLoss ? '#dc2626' : isProfit ? '#16a34a' : '#64748b';
  const realizedColor = realizedPL < 0 ? '#dc2626' : realizedPL > 0 ? '#16a34a' : '#64748b';

  return (
    <div
      className="card fade-up cursor-pointer mb-3 transition-all hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]"
      onClick={() => navigate(`/stock/${stock.id}`)}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          {/* 색상 아이콘 */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            style={{ background: stock.color + '18' }}
          >
            <div className="w-4 h-4 rounded-full" style={{ background: stock.color }} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[16px] font-bold text-foreground">{stock.name}</span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: groupMeta.color + '18', color: groupMeta.color }}
              >
                {groupMeta.label}
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground">{stock.symbol} · {stock.broker}</p>
          </div>
        </div>

        {/* 수익률 뱃지 */}
        <div className={cn(
          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-bold',
          isProfit ? 'bg-emerald-50 text-emerald-700' :
          isLoss   ? 'bg-red-50 text-red-600' :
                     'bg-slate-100 text-slate-500'
        )}>
          {isProfit ? <TrendingUp size={12} /> : isLoss ? <TrendingDown size={12} /> : null}
          {fmtPct(plPct)}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-border mb-3" />

      {/* 스탯 그리드 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <StatItem label="보유 수량" value={`${totalQty.toLocaleString('ko-KR')}${unitLabel}`} />
        <StatItem label="평균 단가" value={fmtPrice(avgPrice, currency)} />
        <StatItem
          label="현재가"
          value={currentPrice ? fmtPrice(currentPrice, currency) : '–'}
          dim={!currentPrice}
          badge={!currentPrice ? '조회 중' : null}
        />
        <StatItem label="평가금액" value={fmtPrice(currentValue, currency)} />
        <StatItem label="평가손익" value={fmtPrice(pl, currency)} color={plColor} bold />
        <StatItem label="실현손익" value={fmtPrice(realizedPL, currency)} color={realizedColor} />
      </div>

      {/* 푸터 */}
      <div className="flex items-center justify-end gap-1 mt-3 text-muted-foreground">
        <span className="text-[11px]">상세 보기</span>
        <ChevronRight size={13} />
      </div>
    </div>
  );
}

function StatItem({ label, value, color, bold, dim, badge }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className={cn(
          'text-[14px]',
          bold ? 'font-bold' : 'font-semibold',
          dim ? 'text-muted-foreground' : 'text-foreground',
        )}
          style={color ? { color } : {}}
        >
          {value}
        </p>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
