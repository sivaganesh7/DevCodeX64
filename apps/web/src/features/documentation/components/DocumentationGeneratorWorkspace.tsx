import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Code2,
  Layers,
  Wrench,
  Database,
  Users,
  Sparkles,
  Download,
  Copy,
  Check,
  Eye,
  FileCode,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  documentationApi,
  DocumentationArtifact,
  DocType,
  GenerateDocumentationPayload,
} from '../services/documentationApi';

interface DocumentationGeneratorWorkspaceProps {
  owner: string;
  repo: string;
  initialFilePath?: string;
  onDocCreated?: (doc: DocumentationArtifact) => void;
}

export const DocumentationGeneratorWorkspace: React.FC<
  DocumentationGeneratorWorkspaceProps
> = ({ owner, repo, initialFilePath, onDocCreated }) => {
  const [docType, setDocType] = useState<DocType>('README');
  const [filePath, setFilePath] = useState(initialFilePath || '');
  const [title, setTitle] = useState('');
  const [contentOverride, setContentOverride] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<DocumentationArtifact | null>(null);
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'RAW'>('PREVIEW');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialFilePath) {
      setFilePath(initialFilePath);
      setDocType('FUNCTION');
    }
  }, [initialFilePath]);

  const docTypes: { type: DocType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      type: 'README',
      label: 'README Guide',
      icon: <FileText size={16} />,
      desc: 'Project introduction, installation, structure, and features',
    },
    {
      type: 'API',
      label: 'API Reference',
      icon: <Code2 size={16} />,
      desc: 'REST API endpoints, query params, schemas, and codes',
    },
    {
      type: 'ARCHITECTURE',
      label: 'Architecture',
      icon: <Layers size={16} />,
      desc: 'Mermaid diagrams, service boundaries, and data flow',
    },
    {
      type: 'FUNCTION',
      label: 'Function Doc',
      icon: <BookOpen size={16} />,
      desc: 'Signatures, parameters, return types, and code examples',
    },
    {
      type: 'SETUP',
      label: 'Setup Guide',
      icon: <Wrench size={16} />,
      desc: 'Prerequisites, local onboarding, and run commands',
    },
    {
      type: 'DATABASE',
      label: 'Database Schema',
      icon: <Database size={16} />,
      desc: 'Relational models, ER diagram, keys, and indexes',
    },
    {
      type: 'DEVELOPER_GUIDE',
      label: 'Contributor Guide',
      icon: <Users size={16} />,
      desc: 'Coding standards, commit conventions, and pull requests',
    },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const payload: GenerateDocumentationPayload = {
        docType,
        filePath: filePath.trim() || undefined,
        title: title.trim() || undefined,
        content: contentOverride.trim() || undefined,
      };

      const result = await documentationApi.generateDocumentation(owner, repo, payload);
      setActiveDoc(result);
      setActiveTab('PREVIEW');
      if (onDocCreated) {
        onDocCreated(result);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate documentation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${activeDoc.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'document'}.md`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Basic formatted markdown previewer
  const renderSimpleMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl font-bold text-white border-b border-white/10 pb-2 mt-4 mb-2">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-semibold text-white border-b border-white/10 pb-1.5 mt-4 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-semibold text-indigo-300 mt-3 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 text-xs text-white/80 list-disc my-0.5">
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
      }
      if (line.startsWith('```')) {
        return (
          <div key={idx} className="text-[11px] font-mono text-white/40 my-1">
            {line}
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs text-white/80 leading-relaxed my-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[680px]">
      {/* Configuration Column */}
      <div className="lg:col-span-4 flex flex-col space-y-4 bg-[#12131a] p-5 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Documentation Studio</h3>
            <p className="text-xs text-white/50">Evidence-based documentation generation</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4 flex-1 flex flex-col">
          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
              Select Document Type
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
              {docTypes.map((dt) => (
                <button
                  key={dt.type}
                  type="button"
                  onClick={() => setDocType(dt.type)}
                  className={`p-2.5 rounded-xl text-left transition-all border flex items-center gap-3 ${
                    docType === dt.type
                      ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md shadow-indigo-600/10'
                      : 'bg-[#0a0a0f] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${
                      docType === dt.type ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/50'
                    }`}
                  >
                    {dt.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-semibold block ${
                        docType === dt.type ? 'text-white' : 'text-white/80'
                      }`}
                    >
                      {dt.label}
                    </span>
                    <span className="text-[11px] text-white/40 truncate block">{dt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
              Target File (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. src/auth/jwt.service.ts"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
              Custom Document Title (Optional)
            </label>
            <input
              type="text"
              placeholder={`e.g. ${owner}/${repo} ${docType} Guide`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[110px]">
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
              Additional Context / Snippet (Optional)
            </label>
            <textarea
              placeholder="Paste specific code or key architectural notes to guide the synthesis..."
              value={contentOverride}
              onChange={(e) => setContentOverride(e.target.value)}
              className="w-full flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 font-mono resize-none focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Synthesizing Documentation...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Documentation
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-white/40">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Real Repository Evidence Rule & Zero-Hallucination Active</span>
        </div>
      </div>

      {/* Results / Viewer Column */}
      <div className="lg:col-span-8 flex flex-col bg-[#12131a] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        {activeDoc ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#14151e]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{activeDoc.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-white/50">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-indigo-500/20 text-indigo-300">
                      {activeDoc.docType}
                    </span>
                    <span>•</span>
                    <span>{new Date(activeDoc.createdAt).toLocaleString()}</span>
                    {activeDoc.filePath && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{activeDoc.filePath}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                >
                  <Download size={14} /> Download .md
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
                >
                  {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy Markdown'}
                </button>
              </div>
            </div>

            {/* Sub-nav Tabs */}
            <div className="flex border-b border-white/10 px-4 bg-[#0e0f14]">
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'PREVIEW'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Eye size={14} /> Rendered Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('RAW')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'RAW'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <FileCode size={14} /> Raw Markdown Source
              </button>
            </div>

            {/* Document Content */}
            <div className="flex-1 p-6 overflow-auto">
              {activeTab === 'PREVIEW' ? (
                <div className="p-6 rounded-2xl bg-[#090a0f] border border-white/10 leading-relaxed text-white/90">
                  {renderSimpleMarkdown(activeDoc.content)}
                </div>
              ) : (
                <pre className="p-4 rounded-2xl bg-[#090a0f] border border-white/10 text-xs font-mono text-white/90 overflow-auto leading-relaxed whitespace-pre-wrap">
                  <code>{activeDoc.content}</code>
                </pre>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[500px]">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white">Select a Documentation Type to Synthesize</h3>
            <p className="text-xs text-white/50 max-w-md mt-2 leading-relaxed">
              DevCodeX64 automatically generates publication-grade READMEs, REST API specifications, Architecture designs, Function references, and Database schemas grounded in real codebase evidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
