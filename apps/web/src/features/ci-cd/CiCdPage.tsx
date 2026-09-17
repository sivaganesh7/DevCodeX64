import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PlayCircle,
  ArrowLeft,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';
import {
  ciCdApi,
  PipelineHealth,
  FailureTrends,
  WorkflowRunItem,
  WorkflowRunDetail,
  WorkflowItem,
} from './services/ciCdApi';
import { PipelineHealthCards } from './components/PipelineHealthCards';
import { FailureTrendsChart } from './components/FailureTrendsChart';
import { WorkflowRunsList } from './components/WorkflowRunsList';
import { RunDetailsDrawer } from './components/RunDetailsDrawer';

interface CiCdPageProps {
  owner?: string;
  repo?: string;
  isTab?: boolean;
}

export const CiCdPage: React.FC<CiCdPageProps> = ({
  owner: propOwner,
  repo: propRepo,
  isTab = false,
}) => {
  const params = useParams<{ owner: string; repo: string }>();
  const owner = propOwner || params.owner;
  const repo = propRepo || params.repo;

  const [health, setHealth] = useState<PipelineHealth | null>(null);
  const [trends, setTrends] = useState<FailureTrends | null>(null);
  const [runs, setRuns] = useState<WorkflowRunItem[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [selectedRunDetail, setSelectedRunDetail] = useState<WorkflowRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('');
  const [isReRunning, setIsReRunning] = useState(false);

  const loadData = async (isManualRefresh = false) => {
    if (!owner || !repo) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [healthData, trendsData, runsData, workflowsData] = await Promise.all([
        ciCdApi.getPipelineHealth(owner, repo),
        ciCdApi.getFailureTrends(owner, repo),
        ciCdApi.getWorkflowRuns(owner, repo, {
          status: statusFilter === 'all' ? undefined : statusFilter,
          branch: branchFilter || undefined,
        }),
        ciCdApi.getWorkflows(owner, repo),
      ]);

      setHealth(healthData);
      setTrends(trendsData);
      setRuns(runsData.runs || []);
      setWorkflows(workflowsData || []);
    } catch (err) {
      console.error('Failed to load CI/CD data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [owner, repo, statusFilter, branchFilter]);

  const handleSelectRun = async (run: WorkflowRunItem) => {
    if (!owner || !repo) return;
    try {
      const detail = await ciCdApi.getWorkflowRun(owner, repo, run.id);
      setSelectedRunDetail(detail);
    } catch (err) {
      console.error('Failed to fetch run details:', err);
      // Fallback with basic jobs
      setSelectedRunDetail({
        ...run,
        jobs: [
          {
            id: 1,
            runId: run.id,
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            startedAt: run.runStartedAt,
            durationSeconds: run.durationSeconds,
            steps: [
              {
                name: 'Checkout code',
                status: 'completed',
                conclusion: 'success',
                number: 1,
              },
              {
                name: 'Execute workflow step',
                status: run.status,
                conclusion: run.conclusion,
                number: 2,
              },
            ],
          },
        ],
      });
    }
  };

  const handleReRun = async (runId: number) => {
    if (!owner || !repo) return;
    try {
      setIsReRunning(true);
      await ciCdApi.reRunWorkflow(owner, repo, runId);
      // Reload runs
      await loadData(true);
      if (selectedRunDetail) {
        setSelectedRunDetail({
          ...selectedRunDetail,
          status: 'queued',
          conclusion: null,
        });
      }
    } catch (err) {
      console.error('Failed to re-run workflow:', err);
    } finally {
      setIsReRunning(false);
    }
  };

  const handleAnalyze = async (runId: number) => {
    if (!owner || !repo) throw new Error('Repository missing');
    return ciCdApi.analyzeRunFailure(owner, repo, runId);
  };

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
                Phase 14
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs text-white/50">CI/CD Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
              <PlayCircle size={24} className="text-indigo-400" />
              {owner} / {repo}
            </h1>
          </div>
        </div>

        {/* Action button & Workflows counter */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-[#12121e] text-xs text-white/70">
            <Layers size={14} className="text-indigo-400" />
            <span>{workflows.length} Workflows</span>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-white/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* 1. Pipeline Health Cards */}
      <PipelineHealthCards health={health} isLoading={loading} />

      {/* 2. Failure Trends & Hotspots */}
      <FailureTrendsChart trends={trends} isLoading={loading} />

      {/* 3. Workflow Runs List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
            <Cpu size={16} className="text-indigo-400" />
            Workflow Executions
          </h2>
          <span className="text-xs text-white/40">
            {runs.length} runs listed
          </span>
        </div>

        <WorkflowRunsList
          runs={runs}
          isLoading={loading}
          selectedRunId={selectedRunDetail?.id}
          onSelectRun={handleSelectRun}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          branchFilter={branchFilter}
          onBranchFilterChange={setBranchFilter}
        />
      </div>

      {/* 4. Slide-over Run Detail Inspector */}
      {selectedRunDetail && (
        <RunDetailsDrawer
          run={selectedRunDetail}
          onClose={() => setSelectedRunDetail(null)}
          onReRun={handleReRun}
          onAnalyze={handleAnalyze}
          isReRunning={isReRunning}
        />
      )}
    </div>
  );
};
