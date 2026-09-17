import React from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Trash2,
  Copy,
  Check,
  Code2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { GeneratedTest } from '../services/testGenerationApi';

interface GeneratedTestsListProps {
  tests: GeneratedTest[];
  loading: boolean;
  selectedTestId?: string;
  onSelectTest: (test: GeneratedTest) => void;
  onRunTest: (testId: string) => void;
  onDeleteTest: (testId: string) => void;
  executingTestId?: string;
}

export const GeneratedTestsList: React.FC<GeneratedTestsListProps> = ({
  tests,
  loading,
  selectedTestId,
  onSelectTest,
  onRunTest,
  onDeleteTest,
  executingTestId,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, test: GeneratedTest) => {
    e.stopPropagation();
    navigator.clipboard.writeText(test.testContent);
    setCopiedId(test.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Passed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle size={12} /> Failed
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Loader2 size={12} className="animate-spin" /> Running
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle size={12} /> Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/60 border border-white/15">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-white/50 space-y-3">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
        <span className="text-sm">Loading test history...</span>
      </div>
    );
  }

  if (!tests.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
          <FlaskConical size={24} />
        </div>
        <h4 className="text-base font-semibold text-white">No Generated Tests Yet</h4>
        <p className="text-xs text-white/50 max-w-sm mt-1 mb-4">
          Select any source file in your repository to automatically generate Jest or pytest suites with happy paths, edge cases, and boundary assertions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tests.map((test) => {
        const isSelected = selectedTestId === test.id;
        const isRunning = executingTestId === test.id;

        return (
          <div
            key={test.id}
            onClick={() => onSelectTest(test)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                : 'bg-[#12131a] border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Code2 size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-white truncate">
                      {test.filePath}
                    </span>
                    {test.functionName && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300">
                        {test.functionName}()
                      </span>
                    )}
                    {getStatusBadge(test.executionStatus)}
                    <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/60 font-semibold border border-white/5">
                      {test.framework || test.language}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    Generated {new Date(test.createdAt).toLocaleString()}
                    {test.executedAt && ` • Ran ${new Date(test.executedAt).toLocaleTimeString()}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  title="Run in Sandbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunTest(test.id);
                  }}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-50"
                >
                  {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  Run Sandbox
                </button>

                <button
                  type="button"
                  title="Copy Test Code"
                  onClick={(e) => handleCopy(e, test)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copiedId === test.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>

                <button
                  type="button"
                  title="Delete Test"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTest(test.id);
                  }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {test.testCases && test.testCases.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
                  Test Coverage:
                </span>
                {test.testCases.map((tc, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/5"
                  >
                    {tc.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
