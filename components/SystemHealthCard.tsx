import React from 'react';
import { SystemMetric } from '../types';
import { Server, Activity, Database, Cpu, HardDrive } from 'lucide-react';

interface SystemHealthCardProps {
  metric: SystemMetric;
  iconType: 'server' | 'activity' | 'db' | 'cpu';
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ metric, iconType }) => {
  const percentage = (metric.value / metric.max) * 100;
  
  const getIcon = () => {
    switch (iconType) {
      case 'server': return <Server className="w-5 h-5" />;
      case 'activity': return <Activity className="w-5 h-5" />;
      case 'db': return <Database className="w-5 h-5" />;
      case 'cpu': return <Cpu className="w-5 h-5" />;
      default: return <HardDrive className="w-5 h-5" />;
    }
  };

  const getColor = () => {
    if (percentage > 90) return 'bg-rose-500 text-rose-500';
    if (percentage > 75) return 'bg-amber-500 text-amber-500';
    return 'bg-emerald-500 text-emerald-500';
  };

  const colorClass = getColor();
  const barColor = colorClass.split(' ')[0];
  const textColor = colorClass.split(' ')[1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-lg hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-opacity-10 ${barColor} ${textColor}`}>
          {getIcon()}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-800 ${textColor}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <div className="mb-1 flex justify-between items-end">
        <span className="text-slate-400 text-xs font-medium">{metric.name}</span>
        <span className="text-slate-200 text-lg font-bold font-mono">
          {metric.value} <span className="text-xs text-slate-500 font-normal">{metric.unit}</span>
        </span>
      </div>
      
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1 text-right text-[10px] text-slate-600">
        Max: {metric.max} {metric.unit}
      </div>
    </div>
  );
};