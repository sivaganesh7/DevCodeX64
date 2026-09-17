import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Code2,
  Database,
  Layers,
  Wrench,
  Users,
  Copy,
  Check,
  Trash2,
  Download,
  Loader2,
} from 'lucide-react';
import { DocumentationArtifact, DocType } from '../services/documentationApi';

interface DocumentationHistoryListProps {
  documents: DocumentationArtifact[];
  loading: boolean;
  selectedDocId?: string;
  onSelectDoc: (doc: DocumentationArtifact) => void;
  onDeleteDoc: (docId: string) => void;
}

export const DocumentationHistoryList: React.FC<DocumentationHistoryListProps> = ({
  documents,
  loading,
  selectedDocId,
  onSelectDoc,
  onDeleteDoc,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, doc: DocumentationArtifact) => {
    e.stopPropagation();
    navigator.clipboard.writeText(doc.content);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (e: React.MouseEvent, doc: DocumentationArtifact) => {
    e.stopPropagation();
    const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'document'}.md`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDocTypeIcon = (type: DocType) => {
    switch (type) {
      case 'README':
        return <FileText size={15} />;
      case 'API':
        return <Code2 size={15} />;
      case 'ARCHITECTURE':
        return <Layers size={15} />;
      case 'FUNCTION':
        return <BookOpen size={15} />;
      case 'SETUP':
        return <Wrench size={15} />;
      case 'DATABASE':
        return <Database size={15} />;
      case 'DEVELOPER_GUIDE':
        return <Users size={15} />;
      default:
        return <FileText size={15} />;
    }
  };

  const getDocTypeColor = (type: DocType) => {
    switch (type) {
      case 'README':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'API':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ARCHITECTURE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'FUNCTION':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SETUP':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'DATABASE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'DEVELOPER_GUIDE':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-white/50 space-y-3">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
        <span className="text-sm">Loading documentation library...</span>
      </div>
    );
  }

  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
          <BookOpen size={24} />
        </div>
        <h4 className="text-base font-semibold text-white">No Documentation Generated Yet</h4>
        <p className="text-xs text-white/50 max-w-sm mt-1">
          Use the Documentation Studio to synthesize READMEs, API specifications, Architecture designs, and Function references from real repository code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const isSelected = selectedDocId === doc.id;

        return (
          <div
            key={doc.id}
            onClick={() => onSelectDoc(doc)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                : 'bg-[#12131a] border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2 rounded-lg mt-0.5 border ${getDocTypeColor(doc.docType)}`}>
                  {getDocTypeIcon(doc.docType)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white truncate">
                      {doc.title}
                    </span>
                    <span
                      className={`text-[11px] uppercase font-bold px-2 py-0.5 rounded border ${getDocTypeColor(
                        doc.docType,
                      )}`}
                    >
                      {doc.docType}
                    </span>
                    {doc.filePath && (
                      <span className="text-xs font-mono text-white/50 px-2 py-0.5 rounded bg-white/5">
                        {doc.filePath}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/40 mt-1">
                    Generated {new Date(doc.createdAt).toLocaleString()} • {doc.content.split('\n').length} lines
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  title="Download Markdown"
                  onClick={(e) => handleDownload(e, doc)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Download size={14} />
                </button>

                <button
                  type="button"
                  title="Copy Content"
                  onClick={(e) => handleCopy(e, doc)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copiedId === doc.id ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>

                <button
                  type="button"
                  title="Delete Document"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDoc(doc.id);
                  }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
