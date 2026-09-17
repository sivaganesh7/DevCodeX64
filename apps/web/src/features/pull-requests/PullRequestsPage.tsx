import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GitPullRequest,
  ArrowLeft,
  RefreshCw,
  Filter,
  CheckCircle2,
  GitMerge,
  ShieldAlert,
} from 'lucide-react';
import {
  pullRequestsApi,
  PullRequestDetail,
} from './services/pullRequestsApi';
import { PullRequestsList } from './components/PullRequestsList';
import { PullRequestReviewViewer } from './components/PullRequestReviewViewer';

interface PullRequestsPageProps {
  owner?: string;
  repo?: string;
  isTab?: boolean;
}

export const PullRequestsPage: React.FC<PullRequestsPageProps> = ({
  owner: propOwner,
  repo: propRepo,
  isTab = false,
}) => {
  const params = useParams<{ owner: string; repo: string }>();
  const owner = propOwner || params.owner;
  const repo = propRepo || params.repo;
  const [pullRequests, setPullRequests] = useState<PullRequestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPr, setSelectedPr] = useState<PullRequestDetail | null>(null);
  const [filterState, setFilterState] = useState<string>('all');
  const [analyzingPrNumber, setAnalyzingPrNumber] = useState<number | undefined>(undefined);

  const fetchPrs = async () => {
    if (!owner || !repo) return;
    try {
      setLoading(true);
      const data = await pullRequestsApi.getPullRequests(owner, repo, filterState);
      setPullRequests(data);
      if (data.length > 0 && !selectedPr) {
        setSelectedPr(data[0]);
      }
    } catch (err) {
      console.error('Failed to load pull requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrs();
  }, [owner, repo, filterState]);

  const handleSelectPr = async (pr: PullRequestDetail) => {
    if (!owner || !repo) return;
    setSelectedPr(pr);
    // Fetch full PR details with all reviews
    try {
      const full = await pullRequestsApi.getPullRequest(owner, repo, pr.number);
      setSelectedPr(full);
    } catch (err) {
      console.error('Failed to fetch full PR detail:', err);
    }
  };

  const handleAnalyzePr = async (prNumber: number, postToGithub?: boolean) => {
    if (!owner || !repo) return;
    setAnalyzingPrNumber(prNumber);
    try {
      const updated = await pullRequestsApi.analyzePullRequest(owner, repo, prNumber, {
        postToGithub,
      });
      setSelectedPr(updated);
      setPullRequests((prev) =>
        prev.map((p) => (p.number === prNumber ? { ...p, ...updated } : p)),
      );
    } catch (err) {
      console.error('Failed to analyze PR:', err);
    } finally {
      setAnalyzingPrNumber(undefined);
    }
  };

  const handlePostComment = async (reviewId: string) => {
    if (!owner || !repo || !selectedPr) return;
    try {
      const res = await pullRequestsApi.postReviewComment(owner, repo, selectedPr.number, reviewId);
      if (res.review && selectedPr.reviews) {
        setSelectedPr({
          ...selectedPr,
          reviews: selectedPr.reviews.map((r) => (r.id === reviewId ? { ...r, postedToGithub: true } : r)),
        });
      }
    } catch (err) {
      console.error('Failed to post comment to GitHub:', err);
    }
  };

  const openCount = pullRequests.filter((p) => p.state === 'open').length;
  const mergedCount = pullRequests.filter((p) => p.state === 'merged').length;
  const highRiskCount = pullRequests.filter(
    (p) => p.latestReview?.riskLevel === 'HIGH' || p.latestReview?.riskLevel === 'CRITICAL',
  ).length;

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {!isTab && (
            <Link
              to={`/repositories/${owner}/${repo}`}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70"
            >
              <ArrowLeft size={20} />
            </Link>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
                Phase 13
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs text-white/50">PR Intelligence & Automation</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
              <GitPullRequest size={24} className="text-indigo-400" />
              {owner} / {repo}
            </h1>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3 bg-[#12131a] p-2 px-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 size={14} />
            <span>{openCount} Open</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-purple-400">
            <GitMerge size={14} />
            <span>{mergedCount} Merged</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-rose-400">
            <ShieldAlert size={14} />
            <span>{highRiskCount} High Risk</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <button
            type="button"
            onClick={fetchPrs}
            title="Refresh Pull Requests"
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 pb-2">
        <span className="text-xs text-white/40 flex items-center gap-1 mr-2">
          <Filter size={12} /> Filter:
        </span>
        {(['all', 'open', 'closed'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterState(st)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all border ${
              filterState === st
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-[#12131a] text-white/50 border-white/10 hover:border-white/20'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: PR List */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <PullRequestsList
            pullRequests={pullRequests}
            loading={loading}
            selectedPrNumber={selectedPr?.number}
            onSelectPr={handleSelectPr}
            onAnalyzePr={(num) => handleAnalyzePr(num, false)}
            analyzingPrNumber={analyzingPrNumber}
          />
        </div>

        {/* Right Column: PR Review Viewer */}
        <div className="lg:col-span-7">
          {selectedPr ? (
            <PullRequestReviewViewer
              pullRequest={selectedPr}
              onAnalyze={(postToGithub) => handleAnalyzePr(selectedPr.number, postToGithub)}
              onPostComment={handlePostComment}
              isAnalyzing={analyzingPrNumber === selectedPr.number}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[450px] bg-[#12131a] rounded-2xl border border-white/10">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
                <GitPullRequest size={24} />
              </div>
              <h4 className="text-base font-semibold text-white">Select a Pull Request</h4>
              <p className="text-xs text-white/50 max-w-sm mt-1">
                Choose a pull request from the list to inspect its automated AI code review, risk level, security issues, and post comments to GitHub.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
