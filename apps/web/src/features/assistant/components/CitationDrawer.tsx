import React from 'react';
import { X, FileCode, Copy, Check, ExternalLink } from 'lucide-react';
import { SourceCitation } from '../services/assistantApi';

interface CitationDrawerProps {
  citation: SourceCitation | null;
  onClose: () => void;
  onOpenFile?: (path: string) => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  citation,
  onClose,
  onOpenFile,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    const text = citation.snippet || citation.filePath;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-[#0f111a] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141724]">
          <div className="flex items-center gap-2">
            <FileCode size={18} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">Source Citation Reference</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">
              File Path
            </div>
            <div className="text-sm font-mono text-indigo-300 break-all">
              {citation.filePath}
            </div>

            {(citation.startLine !== undefined && citation.endLine !== undefined) && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-white/50">Lines:</span>
                <span className="px-2 py-0.5 text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                  L{citation.startLine} - L{citation.endLine}
                </span>
              </div>
            )}
          </div>

          {citation.snippet && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">
                  Retrieved Code Snippet
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="relative rounded-xl border border-white/10 bg-[#0a0c14] overflow-hidden">
                <pre className="p-4 text-xs font-mono text-white/90 overflow-x-auto leading-relaxed">
                  {citation.snippet}
                </pre>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200/90 leading-relaxed">
            <div className="font-semibold text-blue-300 mb-1">Verified RAG Source</div>
            This source chunk was retrieved from your repository index using cosine similarity matching. Repository code is isolated and treated as passive untrusted data.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141724] flex items-center justify-end gap-3">
          {onOpenFile && (
            <button
              onClick={() => {
                onOpenFile(citation.filePath);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
            >
              <ExternalLink size={14} />
              Open in Files Tab
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
