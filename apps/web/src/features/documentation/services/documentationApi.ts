import apiClient from '../../../lib/api-client';

export type DocType =
  | 'README'
  | 'API'
  | 'ARCHITECTURE'
  | 'FUNCTION'
  | 'SETUP'
  | 'DATABASE'
  | 'DEVELOPER_GUIDE';

export interface DocumentationArtifact {
  id: string;
  repositoryId: string;
  analysisId?: string | null;
  userId?: string;
  docType: DocType;
  title: string;
  content: string;
  filePath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateDocumentationPayload {
  docType: DocType;
  filePath?: string;
  title?: string;
  content?: string;
}

export const documentationApi = {
  generateDocumentation: async (
    owner: string,
    repo: string,
    payload: GenerateDocumentationPayload,
  ): Promise<DocumentationArtifact> => {
    const res = await apiClient.post(
      `/repositories/${owner}/${repo}/documentation/generate`,
      payload,
    );
    return res.data;
  },

  getDocumentations: async (
    owner: string,
    repo: string,
    docType?: string,
  ): Promise<DocumentationArtifact[]> => {
    const params = docType ? { docType } : {};
    const res = await apiClient.get(
      `/repositories/${owner}/${repo}/documentation`,
      { params },
    );
    return res.data;
  },

  getDocumentationById: async (
    owner: string,
    repo: string,
    docId: string,
  ): Promise<DocumentationArtifact> => {
    const res = await apiClient.get(
      `/repositories/${owner}/${repo}/documentation/${docId}`,
    );
    return res.data;
  },

  deleteDocumentation: async (
    owner: string,
    repo: string,
    docId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(
      `/repositories/${owner}/${repo}/documentation/${docId}`,
    );
    return res.data;
  },
};
