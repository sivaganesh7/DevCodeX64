import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Send,
  Check,
  Loader2,
  FileCode,
  ThumbsUp,
  Lightbulb,
} from 'lucide-react';
import { PullRequestDetail, PullRequestReviewItem } from '../services/pullRequestsApi';

interface PullRequestReviewViewerProps {
  pullRequest: PullRequestDetail;
  onAnalyze: (postToGithub?: boolean) => Promise<void>;
  onPostComment: (reviewId: string) => Promise<void>;
  isAnalyzing: boolean;
}

export const PullRequestReviewViewer: React.FC<PullRequestReviewViewerProps> = ({
  pullRequest,
  onAnalyze,
  onPostComment,
  isAnalyzing,
}) => {
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<'REVIEW' | 'RAW'>('REVIEW');

  const latestReview: PullRequestReviewItem | undefined =
    pullRequest.latestReview || pullRequest.reviews?.[0];

  const handlePost = async () => {
    if (!latestReview) return;
    setIsPostingComment(true);
    try {
      await onPostComment(latestReview.id);
    } finally {
      setIsPostingComment(false);
    }
  };

  const reviewData = latestReview?.reviewData;

  const getRatingBadge = (rating?: string) => {
    switch (rating) {
      case 'EXCELLENT':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            EXCELLENT
          </span>
        );
      case 'GOOD':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            GOOD
          </span>
        );
      case 'NEEDS_WORK':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            NEEDS WORK
          </span>
        );
      case 'POOR':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            POOR
          </span>
        );
      default:
        return null;
    }
  };

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'CRITICAL':
      case 'HIGH':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert size={13} /> HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle size={13} /> MEDIUM RISK
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={13} /> LOW RISK
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12131a] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-[#14151e] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-indigo-400">
              #{pullRequest.number}
            </span>
            <h3 className="text-base font-bold text-white">{pullRequest.title}</h3>
            {pullRequest.htmlUrl && (
              <a
                href={pullRequest.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-white/40 hover:text-white transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-white/50 flex-wrap">
            <span>Opened by @{pullRequest.author || 'author'}</span>
            <span>•</span>
            <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white/70">
              {pullRequest.headBranch} → {pullRequest.baseBranch}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAnalyze(false)}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analyzing PR...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {latestReview ? 'Re-Analyze PR' : 'Run AI Review'}
              </>
            )}
          </button>

          {latestReview && (
            <button
              type="button"
              onClick={handlePost}
              disabled={isPostingComment || latestReview.postedToGithub}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                latestReview.postedToGithub
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
            >
              {isPostingComment ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Posting...
                </>
              ) : latestReview.postedToGithub ? (
                <>
                  <Check size={14} />
                  Posted to GitHub
                </>
              ) : (
                <>
                  <Send size={14} />
                  Post Review to GitHub
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-5 bg-[#0e0f14]">
        <button
          type="button"
          onClick={() => setActiveTab('REVIEW')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'REVIEW'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Sparkles size={14} /> AI Review & Risk Analysis
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RAW')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'RAW'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <FileCode size={14} /> PR Body & Context
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {activeTab === 'REVIEW' ? (
          latestReview ? (
            <>
              {/* Review Metrics Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0a0a0f] border border-white/10">
                <div>
                  <span className="text-[11px] text-white/40 uppercase font-semibold block mb-1">
                    Quality Rating
                  </span>
                  {getRatingBadge(reviewData?.overallRating)}
                </div>

                <div>
                  <span className="text-[11px] text-white/40 uppercase font-semibold block mb-1">
                    Defect Risk
                  </span>
                  {getRiskBadge(latestReview.riskLevel)}
                </div>

                <div>
                  <span className="text-[11px] text-white/40 uppercase font-semibold block mb-1">
                    Issues Detected
                  </span>
                  <span className="text-sm font-bold text-white">
                    {latestReview.issuesFound}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-white/40 uppercase font-semibold block mb-1">
                    Security Pitfalls
                  </span>
                  <span className="text-sm font-bold text-rose-400">
                    {latestReview.securityIssues}
                  </span>
                </div>
              </div>

              {/* Summary Narrative */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-white/50 block">
                  AI Review Summary
                </span>
                <p className="text-sm text-white/90 leading-relaxed">
                  {latestReview.summary || 'No narrative provided.'}
                </p>
              </div>

              {/* Issues List */}
              {reviewData?.issues && reviewData.issues.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-white/70">
                    Code Review Findings ({reviewData.issues.length})
                  </h4>
                  <div className="space-y-2.5">
                    {reviewData.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#0a0a0f] border border-white/10 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              issue.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300'
                                : issue.severity === 'HIGH'
                                ? 'bg-rose-500/15 text-rose-400'
                                : issue.severity === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-blue-500/15 text-blue-300'
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-xs uppercase text-white/40 font-mono">
                            {issue.category}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {issue.title}
                          </span>
                        </div>
                        <p className="text-xs text-white/70">{issue.description}</p>
                        {issue.recommendation && (
                          <div className="text-xs text-indigo-300 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                            <strong>Recommendation:</strong> {issue.recommendation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Positives & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewData?.positives && reviewData.positives.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <ThumbsUp size={14} />
                      <span>Strengths & Highlights</span>
                    </div>
                    <ul className="space-y-1 text-xs text-white/70 list-disc ml-4">
                      {reviewData.positives.map((pos, idx) => (
                        <li key={idx}>{pos}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {reviewData?.recommendations && reviewData.recommendations.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                      <Lightbulb size={14} />
                      <span>Action Items</span>
                    </div>
                    <ul className="space-y-1 text-xs text-white/70 list-disc ml-4">
                      {reviewData.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-white/10 rounded-2xl bg-white/[0.02]">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
                <Sparkles size={24} />
              </div>
              <h4 className="text-base font-semibold text-white">No AI Review Run Yet</h4>
              <p className="text-xs text-white/50 max-w-sm mt-1 mb-4">
                Click "Run AI Review" above to analyze the pull request diff, predict defect risk, and detect vulnerabilities.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/10">
              <span className="text-xs uppercase tracking-wider font-semibold text-white/50 block mb-2">
                Pull Request Description
              </span>
              <p className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
                {pullRequest.body || 'No description provided by the author.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
