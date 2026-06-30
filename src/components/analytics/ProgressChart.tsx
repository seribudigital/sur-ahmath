'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ProgressChartProps {
  data: {
    period: string;      // e.g. "Minggu 1", "Minggu 2"
    accuracy: number;    // e.g. 85.5
    speed: number;       // e.g. 2.7 (seconds)
  }[];
}

export default function ProgressChart({ data }: ProgressChartProps) {
  // If data is empty, display a placeholder state
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
        <span className="w-full text-sm text-slate-400 font-medium">Belum ada riwayat mingguan yang tercatat</span>
      </div>
    );
  }

  // Format tooltip content
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-100 bg-white/95 p-3 shadow-md backdrop-blur-sm">
          <p className="text-xs font-bold text-slate-800 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name === 'Akurasi' 
                ? `${entry.name}: ${entry.value}%` 
                : `${entry.name}: ${entry.value} dtk`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          
          <XAxis 
            dataKey="period" 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          
          {/* Left Y Axis for Accuracy (%) */}
          <YAxis 
            yAxisId="left"
            domain={[0, 100]} 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            dx={-10}
            tickFormatter={(tick) => `${tick}%`}
          />
          
          {/* Right Y Axis for Speed (seconds) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, 'auto']} 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            dx={10}
            tickFormatter={(tick) => `${tick}s`}
          />

          <Tooltip content={customTooltip} cursor={{ stroke: '#f1f5f9' }} />
          
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#475569' }}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="accuracy"
            name="Akurasi"
            stroke="#0d9488" /* Teal accent */
            strokeWidth={3}
            activeDot={{ r: 6, strokeWidth: 0 }}
            dot={{ r: 4, strokeWidth: 0, fill: '#0d9488' }}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="speed"
            name="Kecepatan"
            stroke="#4f46e5" /* Indigo accent */
            strokeWidth={3}
            activeDot={{ r: 6, strokeWidth: 0 }}
            dot={{ r: 4, strokeWidth: 0, fill: '#4f46e5' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
