import apiClient from '../../../lib/api-client';

export interface SourceCitation {
  filePath: string;
  startLine?: number;
  endLine?: number;
  snippet?: string;
}

export interface AIResponseMeta {
  id: string;
  confidence?: string;
  sources?: SourceCitation[];
  riskContext?: any[];
  securityContext?: any[];
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
  aiResponse?: AIResponseMeta;
  sources?: SourceCitation[];
  confidence?: string;
}

export interface Conversation {
  id: string;
  repositoryId: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: ConversationMessage[];
}

export interface IndexingStatus {
  repositoryId: string;
  totalFiles: number;
  indexedChunks: number;
  isIndexed: boolean;
}

export interface AgentStep {
  iteration: number;
  thought: string;
  action?: string | null;
  actionInput?: Record<string, any> | null;
  observation?: string | null;
}

export interface AgentExecutionResponse {
  task: string;
  steps: AgentStep[];
  finalAnswer: string;
  iterationsUsed: number;
  success: boolean;
  toolsUsed: string[];
  conversationId: string;
  messageId?: string;
  createdAt: string;
}

export interface RunAgentPayload {
  task: string;
  conversationId?: string;
  maxIterations?: number;
}

export const assistantApi = {
  getConversations: async (owner: string, repo: string): Promise<Conversation[]> => {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/assistant/conversations`);
    return res.data;
  },

  createConversation: async (owner: string, repo: string, title?: string): Promise<Conversation> => {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/assistant/conversations`, { title });
    return res.data;
  },

  getConversation: async (owner: string, repo: string, convId: string): Promise<Conversation> => {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/assistant/conversations/${convId}`);
    return res.data;
  },

  deleteConversation: async (owner: string, repo: string, convId: string): Promise<void> => {
    await apiClient.delete(`/repositories/${owner}/${repo}/assistant/conversations/${convId}`);
  },

  sendMessage: async (
    owner: string,
    repo: string,
    convId: string,
    content: string,
  ): Promise<{ userMessage: ConversationMessage; assistantMessage: ConversationMessage }> => {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/assistant/conversations/${convId}/messages`, {
      content,
    });
    return res.data;
  },

  runAgentTask: async (
    owner: string,
    repo: string,
    payload: RunAgentPayload,
  ): Promise<AgentExecutionResponse> => {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/assistant/agent`, payload);
    return res.data;
  },

  triggerIndexing: async (owner: string, repo: string): Promise<{ status: string; message: string }> => {
    const res = await apiClient.post(`/repositories/${owner}/${repo}/assistant/index`);
    return res.data;
  },

  getIndexingStatus: async (owner: string, repo: string): Promise<IndexingStatus> => {
    const res = await apiClient.get(`/repositories/${owner}/${repo}/assistant/indexing/status`);
    return res.data;
  },
};
