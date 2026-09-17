import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, FileCode, GitPullRequest } from 'lucide-react';
import { ReviewRating, ReviewIssue } from '../services/codeReviewApi';

interface ReviewSummaryCardProps {
  overallRating: ReviewRating;
  summary: string;
  issues: ReviewIssue[];
  reviewType: 'FILE' | 'PR';
  targetLabel?: string;
  createdAt?: string;
}

export const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({
  overallRating,
  summary,
  issues,
  reviewType,
  targetLabel,
  createdAt,
}) => {
  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = issues.filter((i) => i.severity === 'HIGH').length;
  const mediumCount = issues.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = issues.filter((i) => i.severity === 'LOW').length;

  const getRatingStyle = (rating: ReviewRating) => {
    switch (rating) {
      case 'EXCELLENT':
        return {
          label: 'EXCELLENT',
          badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-900/30',
          indicatorClass: 'bg-emerald-500',
          desc: 'High architectural quality & minimal risk',
        };
      case 'GOOD':
        return {
          label: 'GOOD',
          badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-blue-900/30',
          indicatorClass: 'bg-blue-500',
          desc: 'Solid codebase with standard recommendations',
        };
      case 'NEEDS_WORK':
        return {
          label: 'NEEDS WORK',
          badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-900/30',
          indicatorClass: 'bg-amber-500',
          desc: 'Significant issues or vulnerabilities to resolve',
        };
      case 'POOR':
        return {
          label: 'POOR',
          badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-rose-900/30',
          indicatorClass: 'bg-rose-500',
          desc: 'Critical security or design violations found',
        };
      default:
        return {
          label: rating,
          badgeClass: 'bg-white/10 text-white/70 border-white/20',
          indicatorClass: 'bg-gray-400',
          desc: '',
        };
    }
  };

  const ratingConfig = getRatingStyle(overallRating);

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            {reviewType === 'PR' ? <GitPullRequest size={22} /> : <FileCode size={22} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                AI {reviewType === 'PR' ? 'Pull Request Diff' : 'Source File'} Review
              </span>
              {createdAt && (
                <span className="text-xs text-white/40">
                  {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-white mt-0.5 break-all">
              {targetLabel || (reviewType === 'PR' ? 'Pull Request Changes' : 'Target Source File')}
            </h2>
          </div>
        </div>

        {/* Overall Rating Pill */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm font-semibold text-sm tracking-wide ${ratingConfig.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${ratingConfig.indicatorClass}`} />
            <span>{ratingConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="mt-5 text-sm text-slate-300 leading-relaxed bg-white/[0.02] border border-white/5 rounded-lg p-4">
        {summary}
      </div>

      {/* Issue Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3.5 flex items-center gap-3">
          <ShieldAlert className="text-rose-400 shrink-0" size={20} />
          <div>
            <div className="text-xl font-bold text-rose-300">{criticalCount}</div>
            <div className="text-xs text-rose-400/80 font-medium uppercase tracking-wider">Critical</div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-center gap-3">
          <AlertTriangle className="text-amber-400 shrink-0" size={20} />
          <div>
            <div className="text-xl font-bold text-amber-300">{highCount}</div>
            <div className="text-xs text-amber-400/80 font-medium uppercase tracking-wider">High</div>
          </div>
        </div>

        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3.5 flex items-center gap-3">
          <AlertCircle className="text-yellow-400 shrink-0" size={20} />
          <div>
            <div className="text-xl font-bold text-yellow-300">{mediumCount}</div>
            <div className="text-xs text-yellow-400/80 font-medium uppercase tracking-wider">Medium</div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3.5 flex items-center gap-3">
          <Info className="text-blue-400 shrink-0" size={20} />
          <div>
            <div className="text-xl font-bold text-blue-300">{lowCount}</div>
            <div className="text-xs text-blue-400/80 font-medium uppercase tracking-wider">Low / Style</div>
          </div>
        </div>
      </div>
    </div>
  );
};
