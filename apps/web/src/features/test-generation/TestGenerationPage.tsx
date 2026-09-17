import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FlaskConical,
  ArrowLeft,
  History,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { testGenerationApi, GeneratedTest } from './services/testGenerationApi';
import { TestGeneratorWorkspace } from './components/TestGeneratorWorkspace';
import { GeneratedTestsList } from './components/GeneratedTestsList';

export const TestGenerationPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [tests, setTests] = useState<GeneratedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'WORKSPACE' | 'HISTORY'>('WORKSPACE');
  const [selectedTest, setSelectedTest] = useState<GeneratedTest | null>(null);
  const [executingTestId, setExecutingTestId] = useState<string | undefined>(undefined);

  const fetchTests = async () => {
    if (!owner || !repo) return;
    try {
      setLoading(true);
      const data = await testGenerationApi.getTests(owner, repo);
      setTests(data);
    } catch (err) {
      console.error('Failed to load generated tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [owner, repo]);

  const handleTestCreated = (newTest: GeneratedTest) => {
    setTests((prev) => {
      const filtered = prev.filter((t) => t.id !== newTest.id);
      return [newTest, ...filtered];
    });
    setSelectedTest(newTest);
  };

  const handleRunTest = async (testId: string) => {
    if (!owner || !repo) return;
    setExecutingTestId(testId);
    try {
      const updated = await testGenerationApi.executeTest(owner, repo, testId);
      setTests((prev) => prev.map((t) => (t.id === testId ? updated : t)));
      if (selectedTest?.id === testId) {
        setSelectedTest(updated);
      }
    } catch (err) {
      console.error('Failed to execute test in sandbox:', err);
    } finally {
      setExecutingTestId(undefined);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!owner || !repo) return;
    try {
      await testGenerationApi.deleteTest(owner, repo, testId);
      setTests((prev) => prev.filter((t) => t.id !== testId));
      if (selectedTest?.id === testId) {
        setSelectedTest(null);
      }
    } catch (err) {
      console.error('Failed to delete test:', err);
    }
  };

  const passedCount = tests.filter((t) => t.executionStatus === 'passed').length;
  const failedCount = tests.filter((t) => t.executionStatus === 'failed').length;
  const pendingCount = tests.filter((t) => t.executionStatus === 'pending').length;

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* Top Breadcrumbs & Stats */}
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
                Phase 11
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs text-white/50">Test Generation & Safe Execution</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
              <FlaskConical size={24} className="text-indigo-400" />
              {owner} / {repo}
            </h1>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-[#12131a] p-2 px-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 size={14} />
            <span>{passedCount} Passed</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-rose-400">
            <XCircle size={14} />
            <span>{failedCount} Failed</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Clock size={14} />
            <span>{pendingCount} Pending</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <button
            type="button"
            onClick={fetchTests}
            title="Refresh Tests"
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
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
          <Sparkles size={16} /> Generator Workspace
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'HISTORY'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <History size={16} /> Test History ({tests.length})
        </button>
      </div>

      {/* Main View Body */}
      {activeTab === 'WORKSPACE' ? (
        <TestGeneratorWorkspace
          owner={owner || ''}
          repo={repo || ''}
          onTestCreated={handleTestCreated}
        />
      ) : (
        <div className="space-y-4">
          <GeneratedTestsList
            tests={tests}
            loading={loading}
            selectedTestId={selectedTest?.id}
            onSelectTest={(t) => {
              setSelectedTest(t);
              setActiveTab('WORKSPACE');
            }}
            onRunTest={handleRunTest}
            onDeleteTest={handleDeleteTest}
            executingTestId={executingTestId}
          />
        </div>
      )}
    </div>
  );
};
