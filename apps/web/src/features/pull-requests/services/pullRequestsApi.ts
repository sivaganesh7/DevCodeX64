import apiClient from '../../../lib/api-client';

export interface PullRequestReviewItem {
  id: string;
  pullRequestId: string;
  analysisId?: string | null;
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  issuesFound: number;
  securityIssues: number;
  reviewData?: {
    summary: string;
    overallRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK' | 'POOR';
    issues: Array<{
      severity: string;
      category: string;
      title: string;
      description: string;
      recommendation: string;
    }>;
    positives: string[];
    recommendations: string[];
  };
  postedToGithub: boolean;
  githubCommentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequestDetail {
  id: string;
  repositoryId: string;
  number: number;
  githubPrId?: number | null;
  title: string;
  body?: string | null;
  state: 'open' | 'closed' | 'merged';
  author?: string | null;
  baseBranch: string;
  headBranch: string;
  htmlUrl?: string | null;
  githubCreatedAt?: string | null;
  githubUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reviews?: PullRequestReviewItem[];
  latestReview?: PullRequestReviewItem | null;
  reviewsCount?: number;
}

export interface AnalyzePrPayload {
  postToGithub?: boolean;
}

export const pullRequestsApi = {
  getPullRequests: async (
    owner: string,
    repo: string,
    state?: string,
  ): Promise<PullRequestDetail[]> => {
    const params = state && state !== 'all' ? { state } : {};
    const res = await apiClient.get(`/repositories/${owner}/${repo}/pull-requests`, { params });
    return res.data;
  },

  getPullRequest: async (
    owner: string,
    repo: string,
    numberOrId: string | number,
  ): Promise<PullRequestDetail> => {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/pull-requests/${numberOrId}`);
    return res.data;
  },

  analyzePullRequest: async (
    owner: string,
    repo: string,
    numberOrId: string | number,
    payload?: AnalyzePrPayload,
  ): Promise<PullRequestDetail> => {
    const res = await apiClient.post(
      `/repositories/${owner}/${repo}/pull-requests/${numberOrId}/analyze`,
      payload || {},
    );
    return res.data;
  },

  postReviewComment: async (
    owner: string,
    repo: string,
    numberOrId: string | number,
    reviewId?: string,
  ): Promise<{ success: boolean; commentId?: number; review?: any }> => {
    const res = await apiClient.post(
      `/repositories/${owner}/${repo}/pull-requests/${numberOrId}/comment`,
      { reviewId },
    );
    return res.data;
  },
};
