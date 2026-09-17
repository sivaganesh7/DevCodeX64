import React from 'react';
import {
  GitPullRequest,
  GitMerge,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { PullRequestDetail } from '../services/pullRequestsApi';

interface PullRequestsListProps {
  pullRequests: PullRequestDetail[];
  loading: boolean;
  selectedPrNumber?: number;
  onSelectPr: (pr: PullRequestDetail) => void;
  onAnalyzePr?: (prNumber: number) => void;
  analyzingPrNumber?: number;
}

export const PullRequestsList: React.FC<PullRequestsListProps> = ({
  pullRequests,
  loading,
  selectedPrNumber,
  onSelectPr,
  onAnalyzePr,
  analyzingPrNumber,
}) => {
  const getStateBadge = (state: string) => {
    switch (state) {
      case 'merged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <GitMerge size={12} /> Merged
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <CheckCircle2 size={12} /> Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <GitPullRequest size={12} /> Open
          </span>
        );
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert size={11} /> High Risk
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle size={11} /> Med Risk
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={11} /> Low Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-white/40 bg-white/5 border border-white/5">
            <Clock size={11} /> Unanalyzed
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-white/50 space-y-3">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
        <span className="text-sm">Loading pull requests...</span>
      </div>
    );
  }

  if (!pullRequests.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
          <GitPullRequest size={24} />
        </div>
        <h4 className="text-base font-semibold text-white">No Pull Requests Found</h4>
        <p className="text-xs text-white/50 max-w-sm mt-1">
          When pull requests are opened on your GitHub repository, DevCodeX64 automatically detects changed files, runs AI code review, and surfaces defect risks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pullRequests.map((pr) => {
        const isSelected = selectedPrNumber === pr.number;
        const isAnalyzing = analyzingPrNumber === pr.number;
        const review = pr.latestReview || pr.reviews?.[0];

        return (
          <div
            key={pr.id}
            onClick={() => onSelectPr(pr)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                : 'bg-[#12131a] border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <GitPullRequest size={18} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white">
                      {pr.title}
                    </span>
                    <span className="font-mono text-xs text-white/40">#{pr.number}</span>
                    {getStateBadge(pr.state)}
                    {getRiskBadge(review?.riskLevel)}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-white/50">
                    <span>by @{pr.author || 'unknown'}</span>
                    <span>•</span>
                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-[11px] text-white/70">
                      {pr.headBranch} → {pr.baseBranch}
                    </span>
                    {review && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-300">
                          {review.issuesFound} issues ({review.securityIssues} security)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {onAnalyzePr && (
                  <button
                    type="button"
                    title="Analyze PR with AI"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnalyzePr(pr.number);
                    }}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    Analyze
                  </button>
                )}

                {pr.htmlUrl && (
                  <a
                    href={pr.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}

                <ChevronRight size={16} className="text-white/30" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
