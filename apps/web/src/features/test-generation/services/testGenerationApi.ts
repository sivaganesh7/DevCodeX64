import apiClient from '../../../lib/api-client';

export interface TestCaseItem {
  name: string;
  description: string;
  category: 'HAPPY_PATH' | 'EDGE_CASE' | 'BOUNDARY' | 'ERROR_CASE';
}

export interface GeneratedTest {
  id: string;
  repositoryId: string;
  filePath: string;
  functionName?: string | null;
  testContent: string;
  language: string;
  framework?: string | null;
  executionStatus: 'pending' | 'running' | 'passed' | 'failed' | 'error' | 'skipped';
  executionOutput?: string | null;
  testCases?: TestCaseItem[];
  executedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateTestPayload {
  filePath: string;
  functionName?: string;
  language?: string;
  framework?: string;
  content?: string;
}

export interface ExecuteTestPayload {
  timeoutSeconds?: number;
}

export const testGenerationApi = {
  generateTest: async (
    owner: string,
    repo: string,
    payload: GenerateTestPayload,
  ): Promise<GeneratedTest> => {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/tests/generate`, payload);
    return res.data;
  },

  executeTest: async (
    owner: string,
    repo: string,
    testId: string,
    payload?: ExecuteTestPayload,
  ): Promise<GeneratedTest> => {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/tests/${testId}/execute`, payload || {});
    return res.data;
  },

  getTests: async (
    owner: string,
    repo: string,
    filePath?: string,
  ): Promise<GeneratedTest[]> => {
    const params = filePath ? { filePath } : {};
    const res = await apiClient.get(`/repositories/${owner}/${repo}/tests`, { params });
    return res.data;
  },

  getTestById: async (
    owner: string,
    repo: string,
    testId: string,
  ): Promise<GeneratedTest> => {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/tests/${testId}`);
    return res.data;
  },

  deleteTest: async (
    owner: string,
    repo: string,
    testId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/repositories/${owner}/${repo}/tests/${testId}`);
    return res.data;
  },
};
