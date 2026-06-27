'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatAmount } from '@/lib/utils';

export interface MerchantSlice {
  name: string;
  value: number;
  count: number;
  percentage: number;
}

interface Props {
  data: MerchantSlice[];
}

const COLORS = [
  '#fb7185', '#f472b6', '#c084fc', '#f9a8d4',
  '#fbbf24', '#a78bfa', '#34d399', '#fda4af',
  '#cbd5e1',
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: MerchantSlice }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 mb-0.5">{d.name}</p>
      <p className="text-rose-500">{formatAmount(d.value)}</p>
      <p className="text-gray-500">
        {d.count}건 · {d.percentage.toFixed(1)}%
      </p>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export function MerchantPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius="45%"
          outerRadius="68%"
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
