import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtext: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  colorClass?: string; // Optional custom color configurations
}

export default function MetricCard({
  title,
  value,
  subtext,
  trend,
  icon,
  colorClass = 'from-blue-600 to-indigo-600',
}: MetricCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group relative">
      {/* Accent glow on hover */}
      <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${colorClass}`} />
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">{title}</span>
          <div className={`p-2.5 rounded-lg bg-slate-50 text-slate-700 transition-colors duration-300 group-hover:bg-slate-100`}>
            {icon}
          </div>
        </div>

        <div className="mt-4 flex items-baseline space-x-2">
          <span className="text-3xl font-bold tracking-tight text-slate-800">{value}</span>
          
          {trend && (
            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-rose-50 text-rose-700'
            }`}>
              {trend.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-400 font-medium">
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}
