import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowRunsQueryDto {
  @IsOptional()
  @IsString()
  workflowId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export interface PipelineHealthDto {
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

export interface TopFailingWorkflowItem {
  workflowId: number | string;
  workflowName: string;
  path: string;
  totalRuns: number;
  failureCount: number;
  failureRate: number;
  mostFailedStep?: string;
}

export interface CommonFailedStepItem {
  stepName: string;
  count: number;
  workflowName?: string;
}

export interface FailureTrendsDto {
  dailyTrends: DailyTrendItem[];
  topFailingWorkflows: TopFailingWorkflowItem[];
  failureByTrigger: Record<string, number>;
  commonFailedSteps: CommonFailedStepItem[];
  flakinessScore: number;
}

export interface AiRunDiagnosisDto {
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
