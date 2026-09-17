export interface DashboardSummaryDto {
  totalRepositories: number;
  overallHealthScore: number;
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  totalOpenPullRequests: number;
  totalAnalysesCompleted: number;
  totalGeneratedTests: number;
  totalDocumentationArtifacts: number;
  ciSuccessRate: number;
}

export interface DashboardRepositoryCardDto {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  isPrivate: boolean;
  language: string | null;
  defaultBranch: string;
  stars: number;
  healthScore: number;
  maintainabilityScore: number;
  complexityScore: number;
  vulnerabilitiesCount: {
    total: number;
    critical: number;
    high: number;
  };
  openPrsCount: number;
  ciStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  lastAnalyzedAt: string | null;
  updatedAt: string;
}

export interface DashboardActivityItemDto {
  id: string;
  type:
    | 'ANALYSIS'
    | 'CODE_REVIEW'
    | 'PR_REVIEW'
    | 'TEST_GENERATION'
    | 'DOCUMENTATION'
    | 'SECURITY_SCAN'
    | 'CI_RUN';
  title: string;
  description: string;
  repositoryName: string;
  repositoryOwner: string;
  timestamp: string;
  status?: string;
  link?: string;
}

export interface DashboardOverviewDto {
  summary: DashboardSummaryDto;
  repositories: DashboardRepositoryCardDto[];
  recentActivity: DashboardActivityItemDto[];
}
