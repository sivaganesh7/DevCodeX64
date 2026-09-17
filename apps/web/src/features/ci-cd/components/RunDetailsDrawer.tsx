import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  GitBranch,
  GitCommit,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Terminal,
  Copy,
  Check,
  AlertCircle,
  Lightbulb,
  Play,
} from 'lucide-react';
import {
  WorkflowRunDetail,
  AiRunDiagnosis,
} from '../services/ciCdApi';

interface RunDetailsDrawerProps {
  run: WorkflowRunDetail | null;
  onClose: () => void;
  onReRun: (runId: number) => Promise<void>;
  onAnalyze: (runId: number) => Promise<AiRunDiagnosis>;
  isReRunning: boolean;
}

export const RunDetailsDrawer: React.FC<RunDetailsDrawerProps> = ({
  run,
  onClose,
  onReRun,
  onAnalyze,
  isReRunning,
}) => {
  const [diagnosis, setDiagnosis] = useState<AiRunDiagnosis | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>({});

  if (!run) return null;

  const toggleJob = (jobId: number) => {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const handleRunDiagnosis = async () => {
    try {
      setIsDiagnosing(true);
      const res = await onAnalyze(run.id);
      setDiagnosis(res);
    } catch (err) {
      console.error('Failed to run diagnosis:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined) return '';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const isFailed = run.conclusion === 'failure';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-[#12121e] border-l border-white/10 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            {run.conclusion === 'success' ? (
              <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
            ) : run.conclusion === 'failure' ? (
              <XCircle size={22} className="text-rose-400 shrink-0" />
            ) : (
              <RotateCw size={22} className="text-amber-400 animate-spin shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white truncate max-w-md">
                  #{run.runNumber} {run.name}
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/50 mt-0.5">
                <span className="flex items-center gap-1 text-white/70">
                  <GitBranch size={12} className="text-indigo-400" />
                  {run.headBranch}
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] text-white/40">
                  <GitCommit size={12} className="inline mr-1" />
                  {run.headSha.substring(0, 7)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDuration(run.durationSeconds)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {run.htmlUrl && (
              <a
                href={run.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="View on GitHub Actions"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 px-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                run.conclusion === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : run.conclusion === 'failure'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              Status: {run.conclusion || run.status}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isFailed && (
              <button
                onClick={handleRunDiagnosis}
                disabled={isDiagnosing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {isDiagnosing ? (
                  <RotateCw size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                Diagnose Failure with AI
              </button>
            )}

            <button
              onClick={() => onReRun(run.id)}
              disabled={isReRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors disabled:opacity-50"
            >
              {isReRunning ? (
                <RotateCw size={13} className="animate-spin" />
              ) : (
                <Play size={13} />
              )}
              Re-run Workflow
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* AI Failure Diagnosis Card */}
          {diagnosis && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
                  <Sparkles size={18} />
                  <span>AI Root Cause Diagnosis</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {diagnosis.rootCauseCategory}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-white/80 space-y-1">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Failed Step: {diagnosis.failedStepName} (
                  {diagnosis.failedJobName})
                </div>
                <p className="text-white/70">{diagnosis.summary}</p>
              </div>

              <div className="text-xs space-y-1">
                <span className="font-semibold text-white/60 uppercase tracking-wider text-[11px]">
                  Analysis & Impact
                </span>
                <p className="text-white/80 leading-relaxed">{diagnosis.diagnosis}</p>
              </div>

              <div className="text-xs space-y-2 pt-2 border-t border-indigo-500/20">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                  <Lightbulb size={14} />
                  <span>Recommended Fix</span>
                </div>
                <div className="text-white/80 whitespace-pre-line leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                  {diagnosis.recommendedFix}
                </div>
              </div>

              {diagnosis.suggestedCommands.length > 0 && (
                <div className="text-xs space-y-2 pt-2">
                  <span className="font-semibold text-white/60 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <Terminal size={12} /> Suggested Local Commands
                  </span>
                  <div className="space-y-1.5">
                    {diagnosis.suggestedCommands.map((cmd) => (
                      <div
                        key={cmd}
                        className="flex items-center justify-between p-2 rounded bg-black/50 border border-white/10 font-mono text-[11px] text-emerald-400"
                      >
                        <span>{cmd}</span>
                        <button
                          onClick={() => copyCommand(cmd)}
                          className="text-white/40 hover:text-white transition-colors p-1"
                          title="Copy command"
                        >
                          {copiedCmd === cmd ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Jobs & Execution Steps */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-xs text-white/40">
              Pipeline Jobs & Steps ({run.jobs?.length || 0})
            </h3>

            {(!run.jobs || run.jobs.length === 0) ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/40 text-center">
                No job steps available for this run.
              </div>
            ) : (
              <div className="space-y-3">
                {run.jobs.map((job) => {
                  const isExpanded = expandedJobs[job.id] ?? true;
                  const isJobFailed = job.conclusion === 'failure';

                  return (
                    <div
                      key={job.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isJobFailed
                          ? 'border-rose-500/30 bg-rose-500/[0.03]'
                          : 'border-white/10 bg-[#0e0e18]'
                      }`}
                    >
                      {/* Job Header Bar */}
                      <button
                        onClick={() => toggleJob(job.id)}
                        className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          {job.conclusion === 'success' ? (
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                          ) : job.conclusion === 'failure' ? (
                            <XCircle size={16} className="text-rose-400 shrink-0" />
                          ) : (
                            <RotateCw size={16} className="text-amber-400 animate-spin shrink-0" />
                          )}
                          <span className="text-sm font-semibold text-white">
                            {job.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-white/50">
                          <span>{formatDuration(job.durationSeconds)}</span>
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-white/40" />
                          ) : (
                            <ChevronRight size={16} className="text-white/40" />
                          )}
                        </div>
                      </button>

                      {/* Steps List */}
                      {isExpanded && job.steps && job.steps.length > 0 && (
                        <div className="p-3 pt-0 border-t border-white/5 divide-y divide-white/5">
                          {job.steps.map((step) => {
                            const isStepFailed = step.conclusion === 'failure';
                            return (
                              <div
                                key={step.number}
                                className={`py-2 px-2 flex items-center justify-between text-xs rounded transition-colors ${
                                  isStepFailed
                                    ? 'bg-rose-500/10 text-rose-300 font-medium'
                                    : 'text-white/70 hover:bg-white/[0.02]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {step.conclusion === 'success' ? (
                                    <CheckCircle2
                                      size={13}
                                      className="text-emerald-400 shrink-0"
                                    />
                                  ) : isStepFailed ? (
                                    <XCircle
                                      size={13}
                                      className="text-rose-400 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full border border-white/20" />
                                  )}
                                  <span className="text-white/40 font-mono text-[10px]">
                                    {step.number}.
                                  </span>
                                  <span>{step.name}</span>
                                </div>

                                <div className="text-[11px] text-white/40">
                                  {formatDuration(step.durationSeconds)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
