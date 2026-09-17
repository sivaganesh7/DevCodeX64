import apiClient from '../../../lib/api-client';

export type ReviewRating = 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK' | 'POOR';
export type ReviewIssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReviewIssueCategory = 'SECURITY' | 'PERFORMANCE' | 'MAINTAINABILITY' | 'CORRECTNESS' | 'STYLE';

export interface ReviewIssue {
  severity: ReviewIssueSeverity;
  category: ReviewIssueCategory;
  title: string;
  description: string;
  file: string;
  line: number | null;
  recommendation: string;
}

export interface StructuredReviewOutput {
  summary: string;
  overallRating: ReviewRating;
  issues: ReviewIssue[];
  positives: string[];
  recommendations: string[];
}

export interface ReviewResultResponse extends StructuredReviewOutput {
  id: string;
  repositoryId: string;
  reviewType: 'FILE' | 'PR';
  filePath?: string;
  pullRequestNumber?: number;
  createdAt: string;
}

export interface ReviewFilePayload {
  filePath: string;
  content?: string;
  language?: string;
  branch?: string;
}

export interface ReviewPrPayload {
  pullRequestNumber?: number;
  diff?: string;
  title?: string;
  body?: string;
}

export interface SavedReviewItem {
  id: string;
  repositoryId: string;
  userId: string;
  filePath?: string | null;
  prNumber?: number | null;
  reviewType: 'FILE' | 'PR';
  summary: string;
  overallRating: ReviewRating;
  issuesCount: number;
  reviewData: StructuredReviewOutput;
  createdAt: string;
  updatedAt: string;
}

export const codeReviewApi = {
  reviewFile: async (
    owner: string,
    repo: string,
    payload: ReviewFilePayload,
  ): Promise<ReviewResultResponse> => {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/review/file`, payload);
    return res.data;
  },

  reviewPr: async (
    owner: string,
    repo: string,
    payload: ReviewPrPayload,
  ): Promise<ReviewResultResponse> => {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/review/pr`, payload);
    return res.data;
  },

  getReviews: async (owner: string, repo: string): Promise<SavedReviewItem[]> => {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/review`);
    return res.data;
  },

  getReviewById: async (
    owner: string,
    repo: string,
    reviewId: string,
  ): Promise<SavedReviewItem> => {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/review/${reviewId}`);
    return res.data;
  },
};
