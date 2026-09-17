import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Terminal,
  ShieldCheck,
  Layers,
  Code2,
  Loader2,
  Sparkles,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import {
  testGenerationApi,
  GeneratedTest,
  GenerateTestPayload,
} from '../services/testGenerationApi';

interface TestGeneratorWorkspaceProps {
  owner: string;
  repo: string;
  initialFilePath?: string;
  onTestCreated?: (test: GeneratedTest) => void;
}

export const TestGeneratorWorkspace: React.FC<TestGeneratorWorkspaceProps> = ({
  owner,
  repo,
  initialFilePath,
  onTestCreated,
}) => {
  const [filePath, setFilePath] = useState(initialFilePath || '');
  const [functionName, setFunctionName] = useState('');
  const [framework, setFramework] = useState<'jest' | 'vitest' | 'pytest'>('jest');
  const [inlineCode, setInlineCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<GeneratedTest | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'CODE' | 'CASES' | 'SANDBOX'>('CODE');

  useEffect(() => {
    if (initialFilePath) {
      setFilePath(initialFilePath);
      if (initialFilePath.endsWith('.py')) {
        setFramework('pytest');
      } else {
        setFramework('jest');
      }
    }
  }, [initialFilePath]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath.trim() && !inlineCode.trim()) {
      setError('Please specify a file path or paste code to generate tests.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const payload: GenerateTestPayload = {
        filePath: filePath.trim() || 'src/sample.ts',
        functionName: functionName.trim() || undefined,
        framework,
        content: inlineCode.trim() || undefined,
        language: framework === 'pytest' ? 'python' : 'typescript',
      };

      const result = await testGenerationApi.generateTest(owner, repo, payload);
      setActiveTest(result);
      setActiveTab('CODE');
      if (onTestCreated) {
        onTestCreated(result);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate tests.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunSandbox = async () => {
    if (!activeTest) return;

    setIsExecuting(true);
    setError(null);

    try {
      const updated = await testGenerationApi.executeTest(owner, repo, activeTest.id, {
        timeoutSeconds: 15,
      });
      setActiveTest(updated);
      setActiveTab('SANDBOX');
      if (onTestCreated) {
        onTestCreated(updated);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to run test in sandbox.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyCode = () => {
    if (!activeTest) return;
    navigator.clipboard.writeText(activeTest.testContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[680px]">
      {/* Configuration Column */}
      <div className="lg:col-span-4 flex flex-col space-y-4 bg-[#12131a] p-5 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FlaskConical size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Test Suite Generator</h3>
            <p className="text-xs text-white/50">Automated unit test synthesis</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4 flex-1 flex flex-col">
          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
              Target File Path
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. src/utils/math.ts"
                value={filePath}
                onChange={(e) => {
                  setFilePath(e.target.value);
                  if (e.target.value.endsWith('.py')) {
                    setFramework('pytest');
                  }
                }}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <FileCode size={16} className="absolute right-3 top-3 text-white/30 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
              Target Function (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. calculateTax or specific method"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
              Test Framework
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['jest', 'vitest', 'pytest'] as const).map((fw) => (
                <button
                  key={fw}
                  type="button"
                  onClick={() => setFramework(fw)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                    framework === fw
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-[#0a0a0f] text-white/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[140px]">
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
              Source Code (Optional Override)
            </label>
            <textarea
              placeholder="Leave empty to load file from repository, or paste snippet directly here..."
              value={inlineCode}
              onChange={(e) => setInlineCode(e.target.value)}
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
                Generating Test Suite...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Unit Tests
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-white/40">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Strict Prompt Isolation & Sandbox Safety Guard Active</span>
        </div>
      </div>

      {/* Results & Execution Column */}
      <div className="lg:col-span-8 flex flex-col bg-[#12131a] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        {activeTest ? (
          <div className="flex flex-col h-full">
            {/* Header / Tabs */}
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#14151e]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Code2 size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold font-mono text-white">
                      {activeTest.filePath}
                    </h4>
                    {activeTest.functionName && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300">
                        {activeTest.functionName}()
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-white/50">
                    <span>{activeTest.framework?.toUpperCase()}</span>
                    <span>•</span>
                    <span className="capitalize">{activeTest.executionStatus}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunSandbox}
                  disabled={isExecuting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Executing in Sandbox...
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      Run in Sandbox
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Sub-nav Tabs */}
            <div className="flex border-b border-white/10 px-4 bg-[#0e0f14]">
              <button
                type="button"
                onClick={() => setActiveTab('CODE')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'CODE'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Code2 size={14} /> Test Suite Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CASES')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'CASES'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Layers size={14} /> Test Scenarios ({activeTest.testCases?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SANDBOX')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'SANDBOX'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Terminal size={14} /> Sandbox Execution
                {activeTest.executionStatus === 'passed' && (
                  <CheckCircle2 size={13} className="text-emerald-400" />
                )}
                {activeTest.executionStatus === 'failed' && (
                  <XCircle size={13} className="text-rose-400" />
                )}
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 overflow-auto">
              {activeTab === 'CODE' && (
                <div className="relative h-full">
                  <pre className="p-4 rounded-xl bg-[#090a0f] border border-white/10 text-xs font-mono text-white/90 overflow-auto leading-relaxed h-full min-h-[400px]">
                    <code>{activeTest.testContent}</code>
                  </pre>
                </div>
              )}

              {activeTab === 'CASES' && (
                <div className="space-y-3">
                  {activeTest.testCases && activeTest.testCases.length > 0 ? (
                    activeTest.testCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                          <FlaskConical size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{tc.name}</span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                tc.category === 'HAPPY_PATH'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : tc.category === 'EDGE_CASE'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : tc.category === 'BOUNDARY'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {tc.category.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 mt-1">{tc.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-white/40 text-sm">
                      No explicit test case catalog returned. View the full generated test code in the Test Suite Code tab.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'SANDBOX' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0a0f] border border-white/10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span className="text-xs text-white/80 font-semibold">
                        Ephemeral Isolated Execution Sandbox
                      </span>
                    </div>
                    <span className="text-[11px] text-white/40">
                      Network: Disabled • Memory: 256MB • Timeout: 15s
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#090a0f] border border-white/10 overflow-hidden">
                    <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} />
                        <span>terminal_output.log</span>
                      </div>
                      <span>
                        Status:{' '}
                        <strong className="uppercase text-white">
                          {activeTest.executionStatus}
                        </strong>
                      </span>
                    </div>

                    <pre className="p-4 text-xs font-mono text-emerald-400/90 overflow-auto whitespace-pre-wrap leading-relaxed max-h-[420px]">
                      {activeTest.executionOutput ||
                        `Waiting to execute...\nClick "Run in Sandbox" above to dispatch this test suite to the isolated execution environment.`}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[500px]">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
              <FlaskConical size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white">Select or Enter Code to Generate Tests</h3>
            <p className="text-xs text-white/50 max-w-md mt-2 leading-relaxed">
              DevCodeX64 automatically synthesizes comprehensive unit test suites with Jest, Vitest, or pytest — covering happy paths, edge cases, boundary limits, and error handling.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
