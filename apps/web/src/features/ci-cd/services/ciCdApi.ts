import apiClient from '../../../lib/api-client';

export interface WorkflowItem {
  id: number | string;
  name: string;
  path: string;
  state: string;
  badge_url?: string;
  html_url?: string;
}

export interface WorkflowRunItem {
  id: number;
  name: string;
  workflowId: number | string;
  headBranch: string;
  headSha: string;
  runNumber: number;
  event: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  runStartedAt: string;
  durationSeconds: number;
  actor: {
    login: string;
    avatarUrl?: string;
  };
}

export interface WorkflowRunJobStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
}

export interface WorkflowRunJob {
  id: number;
  runId: number;
  name: string;
  status: string;
  conclusion: string | null;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  steps: WorkflowRunJobStep[];
}

export interface WorkflowRunDetail extends WorkflowRunItem {
  jobs: WorkflowRunJob[];
}

export interface PipelineHealth {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  cancelledCount: number;
  inProgressCount: number;
  successRate: number;
  averageDurationSeconds: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  mttrSeconds: number;
  activeWorkflowsCount: number;
  lastRun?: {
    id: number;
    runNumber: number;
    workflowName: string;
    conclusion: string | null;
    status: string;
    headBranch: string;
    headSha: string;
    createdAt: string;
    durationSeconds: number;
    actor: string;
  };
}

export interface DailyTrendItem {
  date: string;
  success: number;
  failure: number;
  cancelled: number;
  total: number;
  avgDurationSeconds: number;
}

export interface TopFailingWorkflow {
  workflowId: number | string;
  workflowName: string;
  path: string;
  totalRuns: number;
  failureCount: number;
  failureRate: number;
  mostFailedStep?: string;
}

export interface CommonFailedStep {
  stepName: string;
  count: number;
  workflowName?: string;
}

export interface FailureTrends {
  dailyTrends: DailyTrendItem[];
  topFailingWorkflows: TopFailingWorkflow[];
  failureByTrigger: Record<string, number>;
  commonFailedSteps: CommonFailedStep[];
  flakinessScore: number;
}

export interface AiRunDiagnosis {
  runId: number;
  workflowName: string;
  failedJobName: string;
  failedStepName: string;
  rootCauseCategory:
    | 'TEST_FAILURE'
    | 'BUILD_ERROR'
    | 'DEPENDENCY_ISSUE'
    | 'LINT_SYNTAX'
    | 'TIMEOUT_RESOURCES'
    | 'PERMISSIONS_SECRETS'
    | 'ENVIRONMENT';
  summary: string;
  diagnosis: string;
  recommendedFix: string;
  suggestedCommands: string[];
}

export const ciCdApi = {
  async getWorkflows(owner: string, repo: string): Promise<WorkflowItem[]> {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/ci-cd/workflows`);
    return res.data;
  },

  async getWorkflowRuns(
    owner: string,
    repo: string,
    params?: {
      workflowId?: string;
      status?: string;
      branch?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ totalCount: number; runs: WorkflowRunItem[] }> {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/ci-cd/runs`, { params });
    return res.data;
  },

  async getWorkflowRun(
    owner: string,
    repo: string,
    runId: number,
  ): Promise<WorkflowRunDetail> {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/ci-cd/runs/${runId}`);
    return res.data;
  },

  async getPipelineHealth(owner: string, repo: string): Promise<PipelineHealth> {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/ci-cd/health`);
    return res.data;
  },

  async getFailureTrends(owner: string, repo: string): Promise<FailureTrends> {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/ci-cd/failure-trends`);
    return res.data;
  },

  async reRunWorkflow(
    owner: string,
    repo: string,
    runId: number,
  ): Promise<{ message: string; runId: number; status: string }> {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/ci-cd/runs/${runId}/rerun`);
    return res.data;
  },

  async analyzeRunFailure(
    owner: string,
    repo: string,
    runId: number,
  ): Promise<AiRunDiagnosis> {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/ci-cd/runs/${runId}/analyze`);
    return res.data;
  },
};
