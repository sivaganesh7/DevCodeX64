import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  FolderGit2,
  ShieldAlert,
  GitPullRequest,
  PlayCircle,
  Sparkles,
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  ArrowRight,
  FlaskConical,
  BookOpen,
  Lock,
  Globe,
  Star,
  CheckCircle2,
  Server,
  Database,
  Terminal,
} from 'lucide-react';
import {
  dashboardApi,
  DashboardOverview,
} from './services/dashboardApi';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'healthy' | 'attention' | 'private'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOverview = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const data = await dashboardApi.getOverview();
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to load dashboard overview:', err);
      setError('Unable to fetch dashboard intelligence. Backend service might be unreachable.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 pb-12">
        <div className="h-10 w-48 bg-white/5 rounded-lg animate-pulse" />
        <LoadingSkeleton type="metrics" count={4} />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="py-16">
        <ErrorState
          title="Dashboard Unavailable"
          message={error || 'Failed to load dashboard telemetry.'}
          onRetry={() => fetchOverview(true)}
        />
      </div>
    );
  }

  const { summary, repositories, recentActivity } = overview;

  // Filter repositories based on search and category tabs
  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.language && repo.language.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterCategory === 'healthy') return repo.healthScore >= 80;
    if (filterCategory === 'attention') return repo.healthScore < 80 || repo.vulnerabilitiesCount.critical > 0;
    if (filterCategory === 'private') return repo.isPrivate;
    return true;
  });

  const getHealthBadge = (score: number) => {
    if (score >= 85) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        text: 'Optimal',
      };
    }
    if (score >= 70) {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        text: 'Moderate',
      };
    }
    return {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      text: 'At Risk',
    };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ANALYSIS':
        return <Activity size={16} className="text-emerald-400" />;
      case 'PR_REVIEW':
        return <GitPullRequest size={16} className="text-purple-400" />;
      case 'TEST_GENERATION':
        return <FlaskConical size={16} className="text-cyan-400" />;
      case 'DOCUMENTATION':
        return <BookOpen size={16} className="text-indigo-400" />;
      case 'CI_RUN':
        return <PlayCircle size={16} className="text-amber-400" />;
      default:
        return <Sparkles size={16} className="text-indigo-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* 1. Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
              DevCodeX64 Intelligence
            </span>
            <span className="text-white/30">•</span>
            <span className="text-xs text-white/50">Multi-Repo Engineering Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Engineering Dashboard
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOverview(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-white/80 transition-colors disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <Link
            to="/repositories"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={14} />
            <span>Connect Repository</span>
          </Link>
        </div>
      </div>

      {/* 2. Executive Multi-Repo Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Codebase Health Score */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#12121e] flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Codebase Health
            </span>
            <Activity size={18} className="text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {summary.overallHealthScore}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">Avg Score</span>
          </div>
          <div className="mt-3 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${summary.overallHealthScore}%` }}
            />
          </div>
        </div>

        {/* Tracked Repositories */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#12121e] flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Repositories
            </span>
            <FolderGit2 size={18} className="text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {summary.totalRepositories}
            </span>
            <span className="text-xs text-white/40">connected</span>
          </div>
          <div className="mt-3 text-xs text-white/50">
            {summary.totalAnalysesCompleted} total analyses indexed
          </div>
        </div>

        {/* Security Vulnerabilities */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#12121e] flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Security Hotspots
            </span>
            <ShieldAlert size={18} className="text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-400">
              {summary.criticalVulnerabilities}
            </span>
            <span className="text-xs text-white/40">Critical / High</span>
          </div>
          <div className="mt-3 text-xs text-white/50">
            {summary.totalVulnerabilities} total security findings
          </div>
        </div>

        {/* Pull Requests In-Flight */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#12121e] flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Open Pull Requests
            </span>
            <GitPullRequest size={18} className="text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {summary.totalOpenPullRequests}
            </span>
            <span className="text-xs text-purple-400 font-medium">Pending</span>
          </div>
          <div className="mt-3 text-xs text-white/50">
            AI Automated PR Review ready
          </div>
        </div>

        {/* CI/CD Success Rate */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#12121e] flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              CI/CD Pipelines
            </span>
            <PlayCircle size={18} className="text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {summary.ciSuccessRate}%
            </span>
            <span className="text-xs text-cyan-400 font-medium">Pass Rate</span>
          </div>
          <div className="mt-3 text-xs text-white/50">
            Live telemetry & failure trends
          </div>
        </div>
      </div>

      {/* 3. Quick Feature Launchpad Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={repositories[0] ? `/repositories/${repositories[0].owner}/${repositories[0].name}/assistant` : '/repositories'}
          className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">AI Engineering Agent</div>
              <div className="text-[11px] text-white/50">ReAct autonomous loop</div>
            </div>
          </div>
          <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to={repositories[0] ? `/repositories/${repositories[0].owner}/${repositories[0].name}/tests` : '/repositories'}
          className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <FlaskConical size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Test Generator</div>
              <div className="text-[11px] text-white/50">{summary.totalGeneratedTests} test suites generated</div>
            </div>
          </div>
          <ArrowRight size={14} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to={repositories[0] ? `/repositories/${repositories[0].owner}/${repositories[0].name}/documentation` : '/repositories'}
          className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Evidence Documentation</div>
              <div className="text-[11px] text-white/50">{summary.totalDocumentationArtifacts} documents published</div>
            </div>
          </div>
          <ArrowRight size={14} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to={repositories[0] ? `/repositories/${repositories[0].owner}/${repositories[0].name}/ci-cd` : '/repositories'}
          className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <PlayCircle size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">CI/CD Intelligence</div>
              <div className="text-[11px] text-white/50">Run root cause diagnosis</div>
            </div>
          </div>
          <ArrowRight size={14} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* 4. Multi-Repo Grid Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderGit2 size={20} className="text-indigo-400" />
              Connected Repositories ({filteredRepos.length})
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Select a repository to inspect code metrics, reviews, security, and CI pipelines
            </p>
          </div>

          {/* Search & Category Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 w-48"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-white/60 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterCategory('healthy')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === 'healthy' ? 'bg-indigo-600 text-white font-medium' : 'text-white/60 hover:text-white'
                }`}
              >
                Optimal
              </button>
              <button
                onClick={() => setFilterCategory('attention')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === 'attention' ? 'bg-indigo-600 text-white font-medium' : 'text-white/60 hover:text-white'
                }`}
              >
                Needs Review
              </button>
              <button
                onClick={() => setFilterCategory('private')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === 'private' ? 'bg-indigo-600 text-white font-medium' : 'text-white/60 hover:text-white'
                }`}
              >
                Private
              </button>
            </div>
          </div>
        </div>

        {filteredRepos.length === 0 ? (
          <EmptyState
            title="No Repositories Found"
            description={
              searchQuery
                ? `No repositories matched "${searchQuery}". Try clearing search filters.`
                : 'No repositories connected yet. Link your GitHub account to begin continuous code intelligence.'
            }
            actionLabel="Connect GitHub Repo"
            actionHref="/repositories"
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map((repo) => {
              const badge = getHealthBadge(repo.healthScore);
              return (
                <div
                  key={repo.id}
                  className="rounded-2xl border border-white/10 bg-[#12121e] hover:border-indigo-500/40 transition-all p-6 flex flex-col justify-between group shadow-xl hover:shadow-indigo-500/5"
                >
                  <div>
                    {/* Repo Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                          {repo.isPrivate ? (
                            <Lock size={12} className="text-amber-400" />
                          ) : (
                            <Globe size={12} className="text-white/40" />
                          )}
                          <span>{repo.owner}</span>
                        </div>
                        <Link
                          to={`/repositories/${repo.owner}/${repo.name}`}
                          className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate block"
                        >
                          {repo.name}
                        </Link>
                      </div>

                      {/* Health Score Pill */}
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${badge.bg}`}>
                        {repo.healthScore}%
                      </div>
                    </div>

                    {/* Stats & Language */}
                    <div className="flex items-center gap-3 text-xs text-white/50 mb-5">
                      {repo.language && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/70 font-medium">
                          {repo.language}
                        </span>
                      )}
                      {repo.stars > 0 && (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Star size={12} fill="currentColor" />
                          {repo.stars}
                        </span>
                      )}
                      <span className="truncate">branch: {repo.defaultBranch}</span>
                    </div>

                    {/* Quality Indicators Bar */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/20 border border-white/5 text-center text-xs mb-5">
                      <div>
                        <div className="text-white/40 text-[10px] uppercase font-semibold">Security</div>
                        <div
                          className={`font-bold mt-0.5 ${
                            repo.vulnerabilitiesCount.critical > 0
                              ? 'text-rose-400'
                              : repo.vulnerabilitiesCount.high > 0
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {repo.vulnerabilitiesCount.total === 0 ? 'Clear' : `${repo.vulnerabilitiesCount.total} findings`}
                        </div>
                      </div>

                      <div>
                        <div className="text-white/40 text-[10px] uppercase font-semibold">Pull Requests</div>
                        <div className="font-bold text-white mt-0.5">
                          {repo.openPrsCount} Open
                        </div>
                      </div>

                      <div>
                        <div className="text-white/40 text-[10px] uppercase font-semibold">CI Status</div>
                        <div
                          className={`font-bold mt-0.5 ${
                            repo.ciStatus === 'HEALTHY'
                              ? 'text-emerald-400'
                              : repo.ciStatus === 'DEGRADED'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {repo.ciStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Feature Quick Links */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <Link
                        to={`/repositories/${repo.owner}/${repo.name}/review`}
                        className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                        title="Code Review"
                      >
                        Review
                      </Link>
                      <span>•</span>
                      <Link
                        to={`/repositories/${repo.owner}/${repo.name}/tests`}
                        className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                        title="Test Generator"
                      >
                        Tests
                      </Link>
                      <span>•</span>
                      <Link
                        to={`/repositories/${repo.owner}/${repo.name}/ci-cd`}
                        className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                        title="CI/CD Intelligence"
                      >
                        CI/CD
                      </Link>
                    </div>

                    <Link
                      to={`/repositories/${repo.owner}/${repo.name}`}
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Overview</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Live Activity Feed & Platform Health Footer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-[#12121e] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-indigo-400" />
              Recent Cross-Repository Activity
            </h3>
            <span className="text-xs text-white/40">Live stream</span>
          </div>

          <div className="divide-y divide-white/5">
            {recentActivity.map((act) => (
              <div key={act.id} className="py-3.5 flex items-start gap-3.5 first:pt-1 last:pb-1">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 shrink-0 mt-0.5">
                  {getActivityIcon(act.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-white truncate">
                      {act.title}
                    </span>
                    <span className="text-[11px] text-white/40 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-white/60 line-clamp-1 mt-0.5">
                    {act.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-white/40 mt-1">
                    <span className="text-indigo-400 font-medium">
                      {act.repositoryOwner}/{act.repositoryName}
                    </span>
                    {act.link && (
                      <>
                        <span>•</span>
                        <Link
                          to={act.link}
                          className="text-white/60 hover:text-white flex items-center gap-0.5 hover:underline"
                        >
                          <span>Inspect</span>
                          <ExternalLink size={10} />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Services Connectivity Status */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#12121e] flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Server size={18} className="text-emerald-400" />
              Platform Services Status
            </h3>
            <p className="text-xs text-white/50">
              Operational status of core intelligence engines
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80">
                  <Server size={14} className="text-white/40" />
                  <span>NestJS API Gateway</span>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 size={13} /> Operational
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80">
                  <Database size={14} className="text-white/40" />
                  <span>PostgreSQL & Prisma</span>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 size={13} /> Connected
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80">
                  <Terminal size={14} className="text-white/40" />
                  <span>FastAPI Intelligence Engine</span>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 size={13} /> Ready
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80">
                  <PlayCircle size={14} className="text-white/40" />
                  <span>BullMQ & Redis Workers</span>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 size={13} /> Active
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[11px] text-white/40 text-center">
            DevCodeX64 v1.0.0 • All systems operational
          </div>
        </div>
      </div>
    </div>
  );
}
