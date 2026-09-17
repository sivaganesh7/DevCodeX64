import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Search,
  Filter,
  GitBranch,
  GitCommit,
  User,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { WorkflowRunItem } from '../services/ciCdApi';

interface WorkflowRunsListProps {
  runs: WorkflowRunItem[];
  isLoading: boolean;
  selectedRunId?: number;
  onSelectRun: (run: WorkflowRunItem) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  branchFilter: string;
  onBranchFilterChange: (branch: string) => void;
}

export const WorkflowRunsList: React.FC<WorkflowRunsListProps> = ({
  runs,
  isLoading,
  selectedRunId,
  onSelectRun,
  statusFilter,
  onStatusFilterChange,
  branchFilter,
  onBranchFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const getStatusBadge = (status: string, conclusion: string | null) => {
    if (status === 'in_progress' || status === 'queued') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <RotateCw size={12} className="animate-spin text-amber-400" />
          Running
        </span>
      );
    }
    if (conclusion === 'success') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={12} />
          Success
        </span>
      );
    }
    if (conclusion === 'failure') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle size={12} />
          Failed
        </span>
      );
    }
    if (conclusion === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/50 border border-white/10">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white/40 border border-white/10">
        {status}
      </span>
    );
  };

  // Filter runs based on search term
  const filteredRuns = runs.filter((run) => {
    const matchesSearch =
      run.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.headBranch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.headSha.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(run.runNumber).includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="rounded-xl border border-white/10 bg-[#12121e] overflow-hidden flex flex-col">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/20">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              placeholder="Search by workflow, branch, or commit SHA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Status Filters & Branch filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
            {['all', 'success', 'failure', 'in_progress', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => onStatusFilterChange(st)}
                className={`px-3 py-1 rounded-md transition-colors capitalize ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <Filter size={14} className="absolute left-2.5 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Branch filter..."
              value={branchFilter}
              onChange={(e) => onBranchFilterChange(e.target.value)}
              className="pl-7 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 w-32"
            />
          </div>
        </div>
      </div>

      {/* Runs Table */}
      {isLoading ? (
        <div className="p-8 text-center text-white/50 text-sm animate-pulse">
          Loading workflow executions...
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="p-12 text-center text-white/40 text-sm">
          No workflow runs found matching the selected filters.
        </div>
      ) : (
        <div className="divide-y divide-white/5 overflow-x-auto">
          {filteredRuns.map((run) => {
            const isSelected = selectedRunId === run.id;
            return (
              <div
                key={run.id}
                onClick={() => onSelectRun(run)}
                className={`p-4 flex items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors cursor-pointer ${
                  isSelected ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500' : ''
                }`}
              >
                {/* Left: Status & Run Name */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {getStatusBadge(run.status, run.conclusion)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate hover:text-indigo-300 transition-colors">
                        #{run.runNumber} {run.name}
                      </span>
                      {run.conclusion === 'failure' && (
                        <span className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.2 rounded font-medium">
                          <Sparkles size={11} /> AI Diagnosable
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 mt-1">
                      <span className="flex items-center gap-1 text-white/70">
                        <GitBranch size={13} className="text-indigo-400" />
                        {run.headBranch}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-white/40">
                        <GitCommit size={13} />
                        {run.headSha.substring(0, 7)}
                      </span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-white/5 text-[11px] text-white/60">
                        {run.event}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Author, Duration & Details trigger */}
                <div className="flex items-center gap-6 shrink-0 text-xs text-white/50">
                  <div className="hidden sm:flex items-center gap-1.5">
                    {run.actor.avatarUrl ? (
                      <img
                        src={run.actor.avatarUrl}
                        alt={run.actor.login}
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <User size={14} className="text-white/40" />
                    )}
                    <span className="text-white/70">{run.actor.login}</span>
                  </div>

                  <div className="flex items-center gap-1 text-white/60">
                    <Clock size={13} className="text-white/40" />
                    <span>{formatDuration(run.durationSeconds)}</span>
                  </div>

                  <div className="text-white/40 hidden md:block">
                    {new Date(run.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRun(run);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
