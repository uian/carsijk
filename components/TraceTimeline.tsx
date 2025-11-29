import React from 'react';
import { RequestLog, TraceStep } from '../types';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface TraceTimelineProps {
  request: RequestLog;
}

const StepIcon = ({ status }: { status: TraceStep['status'] }) => {
  switch (status) {
    case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'failure': return <XCircle className="w-5 h-5 text-rose-500" />;
    case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    default: return <Clock className="w-5 h-5 text-slate-500" />;
  }
};

export const TraceTimeline: React.FC<TraceTimelineProps> = ({ request }) => {
  return (
    <div className="relative pl-4 space-y-6">
      <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-800" />
      
      {request.steps.map((step, index) => (
        <div key={step.id} className="relative flex items-start gap-4 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="relative z-10 bg-slate-900 p-1">
            <StepIcon status={step.status} />
          </div>
          <div className="flex-1 bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-semibold ${
                step.status === 'success' ? 'text-emerald-400' :
                step.status === 'failure' ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {step.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {step.durationMs}ms
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {step.details}
            </p>
            <div className="mt-1 text-[10px] text-slate-600 font-mono">
              {new Date(step.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};