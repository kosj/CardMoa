'use client';

import { useRef } from 'react';
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
import { formatAmount, seoulDateParts } from '@/lib/utils';
import { useReducedMotion } from '@/app/components/motion';
import { useDashInViewOnce } from './DashInView';

export interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

interface Props {
  data: MonthlyData[];
  year: number;
}

const NOW_SEOUL = seoulDateParts(new Date().toISOString());
const CURRENT_MONTH = NOW_SEOUL.month - 1; // 0-indexed, KST 기준

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

const CHART_HEIGHT = 240;

/** 세로축 눈금 — 금액이 작은 해에도 '0만'이 반복되지 않게 */
function formatYTick(v: number): string {
  if (v === 0) return '0';
  if (v >= 10000) {
    const man = v / 10000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
  }
  return `${Number.isInteger(v / 1000) ? v / 1000 : (v / 1000).toFixed(1)}천`;
}

export function MonthlyBarChart({ data, year }: Props) {
  const thisYear = NOW_SEOUL.year;
  const reduced = useReducedMotion();
  // 막대가 '보일 때' 아래에서 자라나도록, 화면에 들어온 뒤에 차트를 마운트한다
  const boxRef = useRef<HTMLDivElement>(null);
  const inView = useDashInViewOnce(boxRef, 0.25);

  return (
    <div ref={boxRef} style={{ height: CHART_HEIGHT }}>
      {inView && (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYTick}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
            <Bar
              dataKey="total"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduced}
              animationBegin={80}
              animationDuration={800}
              animationEasing="ease-out"
            >
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
      )}
    </div>
  );
}
