import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  History,
  Sparkles,
  FileText,
  Code2,
  Layers,
  RefreshCw,
} from 'lucide-react';
import {
  documentationApi,
  DocumentationArtifact,
} from './services/documentationApi';
import { DocumentationGeneratorWorkspace } from './components/DocumentationGeneratorWorkspace';
import { DocumentationHistoryList } from './components/DocumentationHistoryList';

export const DocumentationPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [documents, setDocuments] = useState<DocumentationArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'WORKSPACE' | 'LIBRARY'>('WORKSPACE');
  const [selectedDoc, setSelectedDoc] = useState<DocumentationArtifact | null>(null);

  const fetchDocs = async () => {
    if (!owner || !repo) return;
    try {
      setLoading(true);
      const data = await documentationApi.getDocumentations(owner, repo);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documentation library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [owner, repo]);

  const handleDocCreated = (newDoc: DocumentationArtifact) => {
    setDocuments((prev) => {
      const filtered = prev.filter((d) => d.id !== newDoc.id);
      return [newDoc, ...filtered];
    });
    setSelectedDoc(newDoc);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!owner || !repo) return;
    try {
      await documentationApi.deleteDocumentation(owner, repo, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error('Failed to delete documentation artifact:', err);
    }
  };

  const readmeCount = documents.filter((d) => d.docType === 'README').length;
  const apiCount = documents.filter((d) => d.docType === 'API').length;
  const archCount = documents.filter((d) => d.docType === 'ARCHITECTURE').length;

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/repositories/${owner}/${repo}`}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
                Phase 12
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs text-white/50">Evidence-Based Documentation</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
              <BookOpen size={24} className="text-indigo-400" />
              {owner} / {repo}
            </h1>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-[#12131a] p-2 px-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-blue-400">
            <FileText size={14} />
            <span>{readmeCount} README</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Code2 size={14} />
            <span>{apiCount} API</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-purple-400">
            <Layers size={14} />
            <span>{archCount} Arch</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <button
            type="button"
            onClick={fetchDocs}
            title="Refresh Documentation"
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('WORKSPACE')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'WORKSPACE'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Sparkles size={16} /> Documentation Studio
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LIBRARY')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'LIBRARY'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <History size={16} /> Document Library ({documents.length})
        </button>
      </div>

      {/* Main View Area */}
      {activeTab === 'WORKSPACE' ? (
        <DocumentationGeneratorWorkspace
          owner={owner || ''}
          repo={repo || ''}
          onDocCreated={handleDocCreated}
        />
      ) : (
        <div className="space-y-4">
          <DocumentationHistoryList
            documents={documents}
            loading={loading}
            selectedDocId={selectedDoc?.id}
            onSelectDoc={(doc) => {
              setSelectedDoc(doc);
              setActiveTab('WORKSPACE');
            }}
            onDeleteDoc={handleDeleteDoc}
          />
        </div>
      )}
    </div>
  );
};
