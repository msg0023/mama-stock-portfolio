import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { buildAssetGroupProfitSeries } from '../utils/calculations';

const GROUP_LINES = [
  { key: 'COIN', label: '코인', color: '#f59e0b' },
  { key: 'KR', label: '국내주식', color: '#16a34a' },
  { key: 'US', label: '미국주식', color: '#2563eb' },
];

export default function AssetGroupProfitTrendChart({ enrichedStocks }) {
  const data = buildAssetGroupProfitSeries(enrichedStocks);
  if (!data.length) {
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
          📊 자산별 수익 추이
        </h3>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 0 }}>
          아직 거래 데이터가 부족해서 추이를 그릴 수 없어요. 자산별 매수나 매도 내역을 조금 더 쌓으면 바로 보입니다.
        </p>
      </div>
    );
  }

  const fmt = (v) => {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + '백만';
    if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + '천';
    return v;
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
        📊 자산별 수익 추이
      </h3>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
        총 평가금액 카드를 눌렀을 때 확인하는 자산군별 누적 손익 추이입니다.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={54} />
          <Tooltip
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
            formatter={(value, name) => [Number(value).toLocaleString('ko-KR') + '원', name]}
            contentStyle={{ fontFamily: 'Noto Sans KR', fontSize: 13, borderRadius: 10 }}
          />
          <Legend wrapperStyle={{ fontSize: 13, fontFamily: 'Noto Sans KR' }} />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 4" />
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
