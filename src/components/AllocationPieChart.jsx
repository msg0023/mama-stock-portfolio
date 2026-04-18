import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { fmtPct } from '../utils/calculations';

export default function AllocationPieChart({ enrichedStocks }) {
  const data = enrichedStocks
    .filter((s) => s.currentValue > 0)
    .map((s) => ({
      name:  s.name,
      value: Math.round(s.currentValue),
      color: s.color,
    }));

  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.value, 0);

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x  = cx + r * Math.cos(-midAngle * RADIAN);
    const y  = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Noto Sans KR' }}>
        {fmtPct(percent * 100).replace('+', '')}
      </text>
    );
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>
        📊 비중 (종목별 비율)
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={90}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [value.toLocaleString('ko-KR') + '원', '평가금액']}
            contentStyle={{ fontFamily: 'Noto Sans KR', fontSize: 13, borderRadius: 10 }}
          />
          <Legend
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ fontSize: 13, fontFamily: 'Noto Sans KR' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
