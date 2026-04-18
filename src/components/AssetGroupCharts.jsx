import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, ReferenceLine,
} from 'recharts';
import { fmtPct } from '../utils/calculations';

export function AssetGroupAllocationChart({ groups }) {
  const data = groups
    .filter((group) => group.value > 0)
    .map((group) => ({ name: group.label, value: Math.round(group.value), color: group.color }));

  if (!data.length) return null;

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Noto Sans KR' }}
      >
        {fmtPct(percent * 100).replace('+', '')}
      </text>
    );
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>
        🥧 자산군 비중
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={90} labelLine={false} label={renderLabel}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [value.toLocaleString('ko-KR') + '원', '평가금액']}
            contentStyle={{ fontFamily: 'Noto Sans KR', fontSize: 13, borderRadius: 10 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AssetGroupPLChart({ groups }) {
  const data = groups.map((group) => ({
    name: group.label,
    pl: Math.round(group.unrealizedPL),
    color: group.unrealizedPL >= 0 ? '#16a34a' : '#dc2626',
  }));

  if (!data.length) return null;

  const fmt = (v) => {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + '백만';
    if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + '천';
    return v.toString();
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>
        📉 자산군별 평가손익
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Noto Sans KR' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fontFamily: 'Noto Sans KR' }} axisLine={false} tickLine={false} width={52} />
          <Tooltip
            formatter={(value) => [value.toLocaleString('ko-KR') + '원', '평가손익']}
            contentStyle={{ fontFamily: 'Noto Sans KR', fontSize: 13, borderRadius: 10 }}
          />
          <ReferenceLine y={0} stroke="#e2e8f0" />
          <Bar dataKey="pl" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
