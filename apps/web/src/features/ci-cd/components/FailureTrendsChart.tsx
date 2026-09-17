import React from 'react';
import {
  TrendingDown,
  AlertTriangle,
  GitCommit,
  GitPullRequest,
  Calendar,
  Terminal,
  Zap,
} from 'lucide-react';
import { FailureTrends } from '../services/ciCdApi';

interface FailureTrendsChartProps {
  trends: FailureTrends | null;
  isLoading: boolean;
}

export const FailureTrendsChart: React.FC<FailureTrendsChartProps> = ({
  trends,
  isLoading,
}) => {
  if (isLoading || !trends) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 h-64 rounded-xl bg-white/5 border border-white/10" />
        <div className="h-64 rounded-xl bg-white/5 border border-white/10" />
      </div>
    );
  }

  // Calculate maximum total runs across daily trends for scaling
  const maxDailyRuns = Math.max(
    1,
    ...trends.dailyTrends.map((d) => d.total),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 7-Day Run Trend Breakdown */}
      <div className="lg:col-span-2 p-6 rounded-xl border border-white/10 bg-[#12121e] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingDown size={18} className="text-indigo-400" />
                Pipeline Run Trends (Last 7 Days)
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Daily distribution of passed vs. failed CI/CD workflow executions
              </p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-emerald-400" />
                <span className="text-white/60">Passed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-rose-400" />
                <span className="text-white/60">Failed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-amber-400" />
                <span className="text-white/60">Cancelled</span>
              </div>
            </div>
          </div>

          {/* Trend Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-white/5">
            {trends.dailyTrends.map((day) => {
              const successH = (day.success / maxDailyRuns) * 100;
              const failH = (day.failure / maxDailyRuns) * 100;
              const cancelH = (day.cancelled / maxDailyRuns) * 100;
              const dayLabel = new Date(day.date).toLocaleDateString(undefined, {
                weekday: 'short',
              });

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/90 border border-white/20 p-2 rounded-lg text-[11px] whitespace-nowrap z-20 shadow-xl">
                    <div className="font-semibold text-white">{day.date}</div>
                    <div className="text-emerald-400">Passed: {day.success}</div>
                    <div className="text-rose-400">Failed: {day.failure}</div>
                    <div className="text-white/50">Total: {day.total}</div>
                  </div>

                  {/* Stacked bar */}
                  <div className="w-full max-w-[32px] bg-white/5 rounded-t-md overflow-hidden flex flex-col-reverse h-full justify-start">
                    {day.total === 0 ? (
                      <div className="w-full h-1 bg-white/10 rounded" />
                    ) : (
                      <>
                        <div
                          className="w-full bg-emerald-400 transition-all duration-500"
                          style={{ height: `${successH}%` }}
                        />
                        <div
                          className="w-full bg-rose-400 transition-all duration-500"
                          style={{ height: `${failH}%` }}
                        />
                        <div
                          className="w-full bg-amber-400 transition-all duration-500"
                          style={{ height: `${cancelH}%` }}
                        />
                      </>
                    )}
                  </div>

                  <span className="text-[11px] text-white/40 group-hover:text-white transition-colors">
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common Failed Steps Preview */}
        <div className="mt-4 pt-2">
          <span className="text-xs uppercase font-semibold tracking-wider text-white/40 block mb-2">
            Most Frequent Failure Points
          </span>
          <div className="flex flex-wrap gap-2">
            {trends.commonFailedSteps.map((step) => (
              <div
                key={step.stepName}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70"
              >
                <Terminal size={12} className="text-rose-400" />
                <span>{step.stepName}</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-rose-500/20 text-rose-300 font-semibold">
                  {step.count} failures
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Failing Workflows & Trigger Breakdown */}
      <div className="p-6 rounded-xl border border-white/10 bg-[#12121e] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              Failure Hotspots
            </h3>
            {/* Flakiness index badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
              <Zap size={12} />
              <span>Flakiness: {trends.flakinessScore}%</span>
            </div>
          </div>

          <p className="text-xs text-white/50 mb-4">
            Workflows ranked by failure frequency and trigger events
          </p>

          {/* Workflow list */}
          <div className="space-y-3">
            {trends.topFailingWorkflows.slice(0, 4).map((wf) => (
              <div
                key={String(wf.workflowId)}
                className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                    {wf.workflowName}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      wf.failureRate > 25
                        ? 'text-rose-400'
                        : wf.failureRate > 10
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {wf.failureRate}% fail rate
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      wf.failureRate > 25
                        ? 'bg-rose-400'
                        : wf.failureRate > 10
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(4, wf.failureRate)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/40">
                  <span>{wf.path}</span>
                  <span>
                    {wf.failureCount} / {wf.totalRuns} runs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failure Triggers Breakdown */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <span className="text-xs uppercase font-semibold tracking-wider text-white/40 block mb-2">
            Failures by Event Trigger
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-white/5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white/60">
                <GitCommit size={13} className="text-indigo-400" /> Push
              </span>
              <span className="font-semibold text-white">
                {trends.failureByTrigger.push || 0}
              </span>
            </div>
            <div className="p-2 rounded bg-white/5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white/60">
                <GitPullRequest size={13} className="text-purple-400" /> PR
              </span>
              <span className="font-semibold text-white">
                {trends.failureByTrigger.pull_request || 0}
              </span>
            </div>
            <div className="p-2 rounded bg-white/5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white/60">
                <Calendar size={13} className="text-cyan-400" /> Schedule
              </span>
              <span className="font-semibold text-white">
                {trends.failureByTrigger.schedule || 0}
              </span>
            </div>
            <div className="p-2 rounded bg-white/5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white/60">
                <Terminal size={13} className="text-emerald-400" /> Manual
              </span>
              <span className="font-semibold text-white">
                {trends.failureByTrigger.workflow_dispatch || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
