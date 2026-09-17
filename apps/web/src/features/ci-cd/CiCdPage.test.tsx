import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PipelineHealthCards } from './components/PipelineHealthCards';
import { FailureTrendsChart } from './components/FailureTrendsChart';
import { WorkflowRunsList } from './components/WorkflowRunsList';
import { RunDetailsDrawer } from './components/RunDetailsDrawer';
import {
  PipelineHealth,
  FailureTrends,
  WorkflowRunItem,
  WorkflowRunDetail,
} from './services/ciCdApi';

describe('CI/CD Components', () => {
  const sampleHealth: PipelineHealth = {
    totalRuns: 25,
    successCount: 20,
    failureCount: 4,
    cancelledCount: 1,
    inProgressCount: 1,
    successRate: 83,
    averageDurationSeconds: 165,
    healthStatus: 'DEGRADED',
    mttrSeconds: 240,
    activeWorkflowsCount: 3,
    lastRun: {
      id: 9001,
      runNumber: 42,
      workflowName: 'CI - Build & Test',
      conclusion: 'success',
      status: 'completed',
      headBranch: 'main',
      headSha: 'a1b2c3d4e5f6',
      createdAt: '2026-09-17T12:00:00Z',
      durationSeconds: 180,
      actor: 'dev-alice',
    },
  };

  const sampleTrends: FailureTrends = {
    dailyTrends: [
      { date: '2026-09-11', success: 3, failure: 0, cancelled: 0, total: 3, avgDurationSeconds: 150 },
      { date: '2026-09-12', success: 2, failure: 1, cancelled: 0, total: 3, avgDurationSeconds: 180 },
      { date: '2026-09-13', success: 4, failure: 0, cancelled: 0, total: 4, avgDurationSeconds: 140 },
      { date: '2026-09-14', success: 1, failure: 2, cancelled: 0, total: 3, avgDurationSeconds: 200 },
      { date: '2026-09-15', success: 5, failure: 0, cancelled: 1, total: 6, avgDurationSeconds: 160 },
      { date: '2026-09-16', success: 3, failure: 1, cancelled: 0, total: 4, avgDurationSeconds: 170 },
      { date: '2026-09-17', success: 2, failure: 0, cancelled: 0, total: 2, avgDurationSeconds: 155 },
    ],
    topFailingWorkflows: [
      {
        workflowId: 101,
        workflowName: 'CI - Build & Test',
        path: '.github/workflows/ci.yml',
        totalRuns: 20,
        failureCount: 4,
        failureRate: 20,
        mostFailedStep: 'Run unit tests',
      },
    ],
    failureByTrigger: { push: 3, pull_request: 1, schedule: 0, workflow_dispatch: 0 },
    commonFailedSteps: [{ stepName: 'Run unit tests', count: 3 }],
    flakinessScore: 12,
  };

  const sampleRuns: WorkflowRunItem[] = [
    {
      id: 9001,
      name: 'CI - Build & Test',
      workflowId: 101,
      headBranch: 'main',
      headSha: 'a1b2c3d4e5f6',
      runNumber: 42,
      event: 'push',
      status: 'completed',
      conclusion: 'success',
      htmlUrl: 'https://github.com/org/repo/actions/runs/9001',
      createdAt: '2026-09-17T12:00:00Z',
      updatedAt: '2026-09-17T12:03:00Z',
      runStartedAt: '2026-09-17T12:00:00Z',
      durationSeconds: 180,
      actor: { login: 'dev-alice' },
    },
    {
      id: 9002,
      name: 'CI - Build & Test',
      workflowId: 101,
      headBranch: 'feature/auth-cookies',
      headSha: 'b2c3d4e5f6a1',
      runNumber: 41,
      event: 'pull_request',
      status: 'completed',
      conclusion: 'failure',
      htmlUrl: 'https://github.com/org/repo/actions/runs/9002',
      createdAt: '2026-09-17T11:00:00Z',
      updatedAt: '2026-09-17T11:02:30Z',
      runStartedAt: '2026-09-17T11:00:00Z',
      durationSeconds: 150,
      actor: { login: 'dev-bob' },
    },
  ];

  it('renders pipeline health metrics accurately', () => {
    render(<PipelineHealthCards health={sampleHealth} isLoading={false} />);

    expect(screen.getByText('DEGRADED')).toBeDefined();
    expect(screen.getByText('83%')).toBeDefined();
    expect(screen.getByText('3 active workflows tracked')).toBeDefined();
    expect(screen.getByText('#42 CI - Build & Test')).toBeDefined();
  });

  it('renders failure trends chart and failure hotspots', () => {
    render(<FailureTrendsChart trends={sampleTrends} isLoading={false} />);

    expect(screen.getByText('Pipeline Run Trends (Last 7 Days)')).toBeDefined();
    expect(screen.getByText('Failure Hotspots')).toBeDefined();
    expect(screen.getByText('CI - Build & Test')).toBeDefined();
    expect(screen.getByText('20% fail rate')).toBeDefined();
    expect(screen.getByText('Flakiness: 12%')).toBeDefined();
  });

  it('renders workflow runs list and handles item selection', () => {
    const onSelect = vi.fn();
    render(
      <WorkflowRunsList
        runs={sampleRuns}
        isLoading={false}
        onSelectRun={onSelect}
        statusFilter="all"
        onStatusFilterChange={vi.fn()}
        branchFilter=""
        onBranchFilterChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/#42 CI - Build & Test/)).toBeDefined();
    expect(screen.getByText(/#41 CI - Build & Test/)).toBeDefined();
    expect(screen.getByText('AI Diagnosable')).toBeDefined();

    fireEvent.click(screen.getByText(/#41 CI - Build & Test/));
    expect(onSelect).toHaveBeenCalledWith(sampleRuns[1]);
  });

  it('renders run details drawer with jobs and executes AI diagnosis', async () => {
    const sampleDetail: WorkflowRunDetail = {
      ...sampleRuns[1],
      jobs: [
        {
          id: 101,
          runId: 9002,
          name: 'Unit Tests',
          status: 'completed',
          conclusion: 'failure',
          startedAt: '2026-09-17T11:00:00Z',
          durationSeconds: 150,
          steps: [
            { name: 'Setup Node', status: 'completed', conclusion: 'success', number: 1, durationSeconds: 10 },
            { name: 'Run test suite', status: 'completed', conclusion: 'failure', number: 2, durationSeconds: 140 },
          ],
        },
      ],
    };

    const mockAnalyze = vi.fn().mockResolvedValue({
      runId: 9002,
      workflowName: 'CI - Build & Test',
      failedJobName: 'Unit Tests',
      failedStepName: 'Run test suite',
      rootCauseCategory: 'TEST_FAILURE',
      summary: 'Assertion failed in auth test suite',
      diagnosis: 'Mock cookie token signature mismatch',
      recommendedFix: 'Update mock signature token fixture in unit test',
      suggestedCommands: ['pnpm test:unit'],
    });

    render(
      <RunDetailsDrawer
        run={sampleDetail}
        onClose={vi.fn()}
        onReRun={vi.fn()}
        onAnalyze={mockAnalyze}
        isReRunning={false}
      />,
    );

    expect(screen.getByText(/#41 CI - Build & Test/)).toBeDefined();
    expect(screen.getByText('Unit Tests')).toBeDefined();
    expect(screen.getByText('Run test suite')).toBeDefined();

    const diagnoseBtn = screen.getByText('Diagnose Failure with AI');
    expect(diagnoseBtn).toBeDefined();
    await act(async () => {
      fireEvent.click(diagnoseBtn);
    });

    expect(mockAnalyze).toHaveBeenCalledWith(9002);
  });
});
