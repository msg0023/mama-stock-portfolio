import { fmtKRW, fmtPct } from '../utils/calculations';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AssetGroupOverview({ groups }) {
  if (!groups.length) return null;

  return (
    <div className="card mb-4">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-foreground">자산군별 현황</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          코인, 국내주식, 미국주식 구분 성과
        </p>
      </div>

      <div className="asset-group-grid">
        {groups.map((group) => {
          const isProfit = group.unrealizedPL >= 0;

          return (
            <div
              key={group.key}
              className="rounded-xl border border-border p-4"
              style={{ background: group.color + '08' }}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: group.color }} />
                  <span className="text-[14px] font-bold text-foreground">{group.label}</span>
                </div>
                <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary border border-border">
                  {group.count}개
                </span>
              </div>

              {/* 평가금액 */}
              <p className="text-[22px] font-bold text-foreground mb-1">{fmtKRW(group.value)}</p>

              {/* 수익률 뱃지 */}
              <div className={cn(
                'inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-full mb-3',
                isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              )}>
                {isProfit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {fmtPct(group.plPct)}
              </div>

              {/* 스탯 그리드 */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border">
                <MiniStat label="평가손익" value={fmtKRW(group.unrealizedPL)} profit={group.unrealizedPL >= 0} />
                <MiniStat label="실현손익" value={fmtKRW(group.realizedPL)} profit={group.realizedPL >= 0} />
                <MiniStat label="총 누적손익" value={fmtKRW(group.totalPL)} profit={group.totalPL >= 0} span />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, profit, span }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={cn(
        'text-[13px] font-bold',
        profit ? 'text-emerald-600' : 'text-red-500'
      )}>
        {value}
      </p>
    </div>
  );
}
