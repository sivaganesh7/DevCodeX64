import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Database,
  Loader2,
  FileCode,
  CheckCircle2,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import {
  assistantApi,
  Conversation,
  ConversationMessage,
  IndexingStatus,
  SourceCitation,
  AgentStep,
} from '../services/assistantApi';
import { CitationDrawer } from './CitationDrawer';
import { AgentTraceViewer } from './AgentTraceViewer';

interface AssistantChatProps {
  owner: string;
  repo: string;
  onOpenFile?: (path: string) => void;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  owner,
  repo,
  onOpenFile,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [mode, setMode] = useState<'CHAT' | 'AGENT'>('CHAT');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState<IndexingStatus | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingMessage, setIndexingMessage] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<SourceCitation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch conversations and indexing status
  useEffect(() => {
    loadConversations();
    checkIndexingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo]);

  // 2. Fetch conversation details when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await assistantApi.getConversations(owner, repo);
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const checkIndexingStatus = async () => {
    try {
      const status = await assistantApi.getIndexingStatus(owner, repo);
      setIndexingStatus(status);
    } catch (err) {
      console.error('Failed to get indexing status', err);
    }
  };

  const loadMessages = async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      const conv = await assistantApi.getConversation(owner, repo, convId);
      setMessages(conv.messages || []);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await assistantApi.createConversation(owner, repo, 'New Chat');
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new conversation', err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await assistantApi.deleteConversation(owner, repo, convId);
      const filtered = conversations.filter((c) => c.id !== convId);
      setConversations(filtered);
      if (activeConvId === convId) {
        setActiveConvId(filtered.length > 0 ? filtered[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputMessage).trim();
    if (!content || isSending) return;

    let convId = activeConvId;
    if (!convId) {
      try {
        const newConv = await assistantApi.createConversation(owner, repo, content.slice(0, 30));
        convId = newConv.id;
        setConversations([newConv, ...conversations]);
        setActiveConvId(convId);
      } catch (err) {
        console.error('Failed to initialize conversation', err);
        return;
      }
    }

    setInputMessage('');
    setIsSending(true);

    // Optimistic UI for user message
    const tempUserMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      conversationId: convId,
      role: 'USER',
      content: mode === 'AGENT' ? `[AGENT TASK] ${content}` : content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      if (mode === 'AGENT') {
        const agentRes = await assistantApi.runAgentTask(owner, repo, {
          task: content,
          conversationId: convId,
        });

        const assistantMsg: ConversationMessage = {
          id: agentRes.messageId || `agent-msg-${Date.now()}`,
          conversationId: convId,
          role: 'ASSISTANT',
          content: agentRes.finalAnswer,
          createdAt: agentRes.createdAt,
          confidence: 'high',
          aiResponse: {
            id: `ai-resp-${Date.now()}`,
            confidence: 'high',
            sources: agentRes.steps as any,
            riskContext: [{ toolsUsed: agentRes.toolsUsed, iterationsUsed: agentRes.iterationsUsed }],
          },
        };

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          tempUserMsg,
          assistantMsg,
        ]);
      } else {
        const result = await assistantApi.sendMessage(owner, repo, convId, content);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          result.userMessage,
          result.assistantMessage,
        ]);
      }
      // refresh conversation list to update title if changed
      loadConversations();
    } catch (err) {
      console.error('Failed to send message', err);
      // add error message
      const errorMsg: ConversationMessage = {
        id: `err-${Date.now()}`,
        conversationId: convId,
        role: 'ASSISTANT',
        content: 'Failed to process response. Please make sure the AI service and backend are running.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTriggerIndexing = async () => {
    setIsIndexing(true);
    setIndexingMessage(null);
    try {
      const res = await assistantApi.triggerIndexing(owner, repo);
      setIndexingMessage(res.message);
      setTimeout(checkIndexingStatus, 3000);
    } catch (err: any) {
      setIndexingMessage('Failed to queue indexing: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsIndexing(false);
    }
  };

  const quickPrompts = [
    'Explain the high-level architecture of this repository.',
    'What authentication and authorization methods are implemented?',
    'Are there any high-risk files or security vulnerabilities?',
    'Summarize the database models and entities used.',
  ];

  return (
    <div className="flex h-[calc(100vh-14rem)] bg-[#0c0d14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* ── Left Sidebar: Conversations ── */}
      <div className="w-72 border-r border-white/10 bg-[#10121d] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Conversations</h2>
          </div>
          <button
            onClick={handleNewConversation}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-white/40">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/40 font-medium'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 mr-2">
                    <MessageSquare size={14} className={isActive ? 'text-indigo-400' : 'text-white/40'} />
                    <span className="truncate">{conv.title || 'Conversation'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-white/40 rounded transition-all"
                    title="Delete Conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Indexing Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0e1019]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1.5">
              <Database size={12} /> Index Status
            </span>
            <span
              className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                indexingStatus?.isIndexed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${indexingStatus?.isIndexed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {indexingStatus?.isIndexed ? `${indexingStatus.indexedChunks} Chunks` : 'Not Indexed'}
            </span>
          </div>

          <button
            onClick={handleTriggerIndexing}
            disabled={isIndexing}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/80 transition-colors disabled:opacity-50"
          >
            {isIndexing ? <Loader2 size={13} className="animate-spin text-indigo-400" /> : <Sparkles size={13} className="text-indigo-400" />}
            {isIndexing ? 'Indexing...' : 'Index Codebase'}
          </button>
          {indexingMessage && (
            <div className="mt-2 text-[10px] text-white/60 bg-white/5 p-1.5 rounded border border-white/5">
              {indexingMessage}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col bg-[#0d0e17]">
        {/* Top Navbar with Mode Switcher */}
        <div className="px-6 py-3.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111320]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              mode === 'AGENT'
                ? 'bg-purple-600/25 border border-purple-500/40 text-purple-400'
                : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400'
            }`}>
              {mode === 'AGENT' ? <Cpu size={18} /> : <Bot size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                {mode === 'AGENT' ? 'AI Engineering Agent (Autonomous ReAct)' : 'Repository Intelligence Assistant'}
              </h3>
              <p className="text-[11px] text-white/50">
                {mode === 'AGENT'
                  ? 'Multi-Step Planning • Tool Registry • Hardcoded Permissions'
                  : 'Retrieval-Augmented Generation • AST-Aware Code Chunking'}
              </p>
            </div>
          </div>

          {/* Controls: Mode Switcher & Guard */}
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                onClick={() => setMode('CHAT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'CHAT'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Sparkles size={13} /> Chat Q&A
              </button>
              <button
                onClick={() => setMode('AGENT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'AGENT'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Cpu size={13} /> Agent Mode
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <ShieldCheck size={14} />
              <span className="text-[11px] font-medium">Prompt Guard</span>
            </div>
          </div>
        </div>

        {/* Agent Safeguards Banner when in AGENT mode */}
        {mode === 'AGENT' && (
          <div className="px-6 py-2.5 bg-purple-950/30 border-b border-purple-500/20 flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-purple-400 shrink-0" />
              <span>
                <strong>Agent Safeguards Active:</strong> Permissions strictly hardcoded to <code className="bg-purple-500/20 px-1 py-0.5 rounded text-[10px]">READ</code> and <code className="bg-purple-500/20 px-1 py-0.5 rounded text-[10px]">GENERATE</code>. Arbitrary shell execution and destructive writes are blocked.
              </span>
            </div>
            <span className="hidden md:inline text-[11px] text-purple-300/60 font-mono">Max: 10 Iterations</span>
          </div>
        )}

        {/* Message Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full text-white/50 text-xs gap-2">
              <Loader2 size={16} className="animate-spin text-indigo-400" />
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl">
                <Sparkles size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-semibold text-white">
                  Ask anything about {owner}/{repo}
                </h4>
                <p className="text-xs text-white/60 leading-relaxed max-w-md">
                  This assistant uses semantic embeddings to search through actual repository files,
                  extract functions and classes, and cite exact line numbers.
                </p>
              </div>

              {/* Starter prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/80 hover:text-white transition-all text-left flex flex-col justify-between group"
                  >
                    <span>{prompt}</span>
                    <span className="text-[10px] text-indigo-400 mt-2 font-medium group-hover:underline flex items-center gap-1">
                      Ask this →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            messages.map((msg) => {
              const isUser = msg.role === 'USER';
              const aiMeta: any = msg.aiResponse || {};
              const sources: SourceCitation[] = msg.sources || aiMeta.sources || [];
              const confidence: string | undefined = msg.confidence || aiMeta.confidence;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#1a1d2e] border border-white/10 text-indigo-400'
                    }`}
                  >
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  <div
                    className={`rounded-2xl px-5 py-4 space-y-3 ${
                      isUser
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-[#151726] border border-white/10 text-white/90 shadow-md'
                    }`}
                  >
                    {/* Header with confidence for assistant */}
                    {!isUser && confidence && (
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                          {sources.length > 0 && 'iteration' in sources[0]
                            ? 'AI Engineering Agent Solution'
                            : 'DevCodeX64 RAG Response'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                            confidence === 'high'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : confidence === 'medium'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          <CheckCircle2 size={10} />
                          {confidence.toUpperCase()} CONFIDENCE
                        </span>
                      </div>
                    )}

                    {/* Render ReAct Trace if agent steps present */}
                    {!isUser && sources.length > 0 && 'iteration' in sources[0] && (
                      <AgentTraceViewer
                        steps={sources as unknown as AgentStep[]}
                        toolsUsed={aiMeta.riskContext?.[0]?.toolsUsed}
                        iterationsUsed={aiMeta.riskContext?.[0]?.iterationsUsed}
                      />
                    )}

                    {/* Content text */}
                    <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* Source Citations (Standard RAG) */}
                    {!isUser && sources.length > 0 && !('iteration' in sources[0]) && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                          <FileCode size={12} className="text-indigo-400" />
                          Source Citations ({sources.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sources.map((cit: SourceCitation, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedCitation(cit)}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-indigo-300 transition-colors"
                            >
                              <FileCode size={12} className="text-white/40" />
                              <span className="truncate max-w-[200px]">{cit.filePath}</span>
                              {cit.startLine !== undefined && (
                                <span className="text-white/40">:L{cit.startLine}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-xl bg-[#1a1d2e] border border-white/10 flex items-center justify-center text-indigo-400 shrink-0">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl px-5 py-4 bg-[#151726] border border-white/10 text-white/70 flex items-center gap-2 text-xs">
                <Loader2 size={14} className="animate-spin text-indigo-400" />
                Retrieving repository context & synthesizing verified answer...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-white/10 bg-[#111320]">
          <div className="flex items-end gap-3 bg-[#0a0b12] border border-white/10 rounded-xl p-2 focus-within:border-indigo-500/60 transition-colors">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'AGENT'
                  ? 'Describe an engineering task for the autonomous agent (e.g. Audit security flaws in auth and draft a test plan)...'
                  : 'Ask a question about this repository... (Enter to send, Shift+Enter for newline)'
              }
              rows={2}
              className="flex-1 bg-transparent text-xs text-white placeholder-white/40 resize-none outline-none p-1.5 leading-relaxed font-sans"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isSending}
              className={`p-2.5 rounded-lg disabled:opacity-30 text-white transition-all shadow-md shrink-0 ${
                mode === 'AGENT' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
              title={mode === 'AGENT' ? 'Run Agent Task' : 'Send Question'}
            >
              {isSending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'AGENT' ? (
                <Cpu size={16} />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-white/40">
            <span>
              {mode === 'AGENT'
                ? 'Autonomous ReAct execution loop with hardcoded permission gates.'
                : 'RAG context is isolated to prevent prompt injection.'}
            </span>
            <span>Markdown supported</span>
          </div>
        </div>
      </div>

      {/* Citation Detail Drawer */}
      <CitationDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
        onOpenFile={onOpenFile}
      />
    </div>
  );
};
