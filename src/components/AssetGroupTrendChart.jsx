import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import { buildAssetGroupTrendSeries } from '../utils/calculations';

const GROUP_LINES = [
  { key: 'COIN', label: '코인', color: '#f59e0b' },
  { key: 'KR', label: '국내주식', color: '#16a34a' },
  { key: 'US', label: '미국주식', color: '#2563eb' },
];

export default function AssetGroupTrendChart({ enrichedStocks }) {
  const data = buildAssetGroupTrendSeries(enrichedStocks);
  if (data.length < 2) return null;

  const fmt = (v) => {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + '백만';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + '천';
    return v;
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
        🌊 자산군별 평가금액 추이
      </h3>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
        현재가 기준으로 코인, 국내주식, 미국주식이 각각 어떻게 쌓였는지 보여줍니다.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
          <Tooltip
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
            formatter={(value, name) => [Number(value).toLocaleString('ko-KR') + '원', name]}
            contentStyle={{ fontFamily: 'Noto Sans KR', fontSize: 13, borderRadius: 10 }}
          />
          <Legend wrapperStyle={{ fontSize: 13, fontFamily: 'Noto Sans KR' }} />
          {GROUP_LINES.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={2.5}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
