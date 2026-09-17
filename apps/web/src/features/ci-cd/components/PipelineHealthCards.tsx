import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  RotateCw,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { PipelineHealth } from '../services/ciCdApi';

interface PipelineHealthCardsProps {
  health: PipelineHealth | null;
  isLoading: boolean;
}

export const PipelineHealthCards: React.FC<PipelineHealthCardsProps> = ({
  health,
  isLoading,
}) => {
  if (isLoading || !health) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-white/5 border border-white/10"
          />
        ))}
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
          icon: <CheckCircle2 size={20} className="text-emerald-400" />,
        };
      case 'DEGRADED':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          dot: 'bg-amber-400',
          icon: <AlertTriangle size={20} className="text-amber-400" />,
        };
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          dot: 'bg-rose-400',
          icon: <XCircle size={20} className="text-rose-400" />,
        };
      default:
        return {
          bg: 'bg-white/5',
          border: 'border-white/10',
          text: 'text-white/60',
          dot: 'bg-white/40',
          icon: <Activity size={20} className="text-white/60" />,
        };
    }
  };

  const statusStyle = getStatusColor(health.healthStatus);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Health Card */}
        <div
          className={`p-5 rounded-xl border ${statusStyle.border} ${statusStyle.bg} flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Pipeline Health
            </span>
            {statusStyle.icon}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${statusStyle.text}`}>
              {health.healthStatus}
            </span>
            <span className="flex h-2 w-2 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusStyle.dot}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${statusStyle.dot}`}
              />
            </span>
          </div>
          <div className="mt-2 text-xs text-white/40">
            {health.activeWorkflowsCount} active workflow
            {health.activeWorkflowsCount === 1 ? '' : 's'} tracked
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#12121e] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Success Rate
            </span>
            <ShieldCheck size={20} className="text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {health.successRate}%
            </span>
            <span className="text-xs text-white/40">
              ({health.successCount}/{health.totalRuns} runs)
            </span>
          </div>
          <div className="mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                health.successRate >= 85
                  ? 'bg-emerald-400'
                  : health.successRate >= 60
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
              style={{ width: `${health.successRate}%` }}
            />
          </div>
        </div>

        {/* Average Duration Card */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#12121e] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Avg Run Duration
            </span>
            <Clock size={20} className="text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {formatDuration(health.averageDurationSeconds)}
            </span>
          </div>
          <div className="mt-2 text-xs text-white/40 flex items-center gap-1.5">
            <RotateCw size={12} className="text-white/30" />
            <span>MTTR: ~{formatDuration(health.mttrSeconds)}</span>
          </div>
        </div>

        {/* Active & Total Runs Card */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#12121e] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Execution Activity
            </span>
            <Activity size={20} className="text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-bold text-white">
                {health.inProgressCount}
              </span>
              <span className="ml-1 text-xs text-purple-400 font-medium">Running</span>
            </div>
            <span className="text-white/20">•</span>
            <div>
              <span className="text-lg font-bold text-white/70">
                {health.failureCount}
              </span>
              <span className="ml-1 text-xs text-rose-400">Failed</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-white/40">
            {health.totalRuns} total recorded runs
          </div>
        </div>
      </div>

      {/* Latest Run Snapshot Bar */}
      {health.lastRun && (
        <div className="p-3 px-4 rounded-xl border border-white/8 bg-[#0e0e18] flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <span className="text-white/40 uppercase font-semibold tracking-wider text-[11px]">
              Latest Run:
            </span>
            <span className="font-semibold text-white">
              #{health.lastRun.runNumber} {health.lastRun.workflowName}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                health.lastRun.conclusion === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : health.lastRun.conclusion === 'failure'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {health.lastRun.conclusion || health.lastRun.status}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <GitBranch size={13} className="text-indigo-400" />
              <span className="text-white/80">{health.lastRun.headBranch}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-white/40" />
              <span>{formatDuration(health.lastRun.durationSeconds)}</span>
            </div>
            <span className="text-white/40">
              by <span className="text-white/70">{health.lastRun.actor}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
