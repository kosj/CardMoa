'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatAmount } from '@/lib/utils';

export interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

interface Props {
  data: MonthlyData[];
  year: number;
}

const CURRENT_MONTH = new Date().getMonth(); // 0-indexed

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: MonthlyData }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const { total, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-rose-500">{formatAmount(total)}</p>
      <p className="text-gray-500">{count}건</p>
    </div>
  );
}

export function MonthlyBarChart({ data, year }: Props) {
  const thisYear = new Date().getFullYear();

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                year === thisYear && index === CURRENT_MONTH
                  ? '#fb7185'
                  : '#fbcfe8'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
