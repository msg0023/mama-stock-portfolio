import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { buildSingleAssetTrendSeries } from '../utils/calculations';

export default function SingleAssetTrendChart({ stock, currentPrice, currencyLabel }) {
  const data = buildSingleAssetTrendSeries(stock, currentPrice);
  if (data.length < 2) return null;

  const moneySuffix = currencyLabel === 'USD' ? '$' : '원';
  const fmt = (v) => {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + '백만';
    if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + '천';
    return v;
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
        📈 종목별 추이
      </h3>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
        남은 원금, 현재 평가금액, 실현손익, 총 누적손익을 한 번에 볼 수 있어요.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={54} />
          <Tooltip
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
            formatter={(value, name) => [`${Number(value).toLocaleString('ko-KR')}${moneySuffix}`, name]}
            contentStyle={{ fontFamily: 'Noto Sans KR', fontSize: 13, borderRadius: 10 }}
          />
          <Legend wrapperStyle={{ fontSize: 13, fontFamily: 'Noto Sans KR' }} />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="invested" name="남은 원금" stroke="#94a3b8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="value" name="평가금액" stroke="#2563eb" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="realizedPL" name="실현손익" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="totalPL" name="총 누적손익" stroke="#7c3aed" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
