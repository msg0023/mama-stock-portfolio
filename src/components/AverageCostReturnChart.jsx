import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { buildAverageCostReturnSeries } from '../utils/calculations';

const MODES = [
  {
    key: 'current',
    label: '현재 보유 기준',
    description: '오늘 기준 평균단가를 과거 시점에도 동일하게 적용합니다.',
  },
  {
    key: 'recalculated',
    label: '일자별 재계산',
    description: '각 날짜까지의 평균단가를 다시 계산해 수익률을 보여줍니다.',
  },
];

export default function AverageCostReturnChart({ enrichedStocks }) {
  const [mode, setMode] = useState('current');

  const currentSeries = buildAverageCostReturnSeries(enrichedStocks, 'current');
  const recalculatedSeries = buildAverageCostReturnSeries(enrichedStocks, 'recalculated');
  const chartData = mode === 'current' ? currentSeries : recalculatedSeries;
  const activeMode = MODES.find((item) => item.key === mode);

  if (currentSeries.length < 2 && recalculatedSeries.length < 2) return null;

  const fmtTick = (value) => `${value}%`;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1e293b' }}>
            🎯 평균단가 기준 수익률 추이
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
            과거 시세 데이터 없이 현재가 기준으로 계산한 비교 그래프입니다.
          </p>
        </div>
        <div className="segmented-control" role="tablist" aria-label="평균단가 기준 선택">
          {MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={mode === item.key ? 'segmented-control__button is-active' : 'segmented-control__button'}
              onClick={() => setMode(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px' }}>
        {activeMode?.description}
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={fmtTick}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}%`, '수익률']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
            contentStyle={{ fontFamily: 'Noto Sans KR', fontSize: 13, borderRadius: 10 }}
          />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="returnPct"
            stroke={mode === 'current' ? '#2563eb' : '#0f766e'}
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
