import { useEffect, useState } from 'react';
import apiClient from '../../lib/api-client';
import { Activity, Code2, AlertTriangle, CheckCircle2, PlayCircle, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { ciCdApi, PipelineHealth } from '../ci-cd/services/ciCdApi';

export function RepositoryOverviewPage({
  owner,
  repo,
  onNavigateToCiCd,
}: {
  owner: string;
  repo: string;
  onNavigateToCiCd?: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysis, setAnalysis] = useState<any>(null);
  const [ciHealth, setCiHealth] = useState<PipelineHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get(`/repositories/${owner}/${repo}/analysis/latest`)
      .then(res => setAnalysis(res.data))
      .catch(err => {
        if (err.response?.status !== 404) {
          setError('Failed to load analysis data.');
        }
      })
      .finally(() => setIsLoading(false));

    ciCdApi.getPipelineHealth(owner, repo)
      .then(res => setCiHealth(res))
      .catch(() => {
        // CI/CD health can be optional if not set up
      });
  }, [owner, repo]);

  if (isLoading) return <div className="p-8 text-white/50 text-center animate-pulse">Loading analysis...</div>;
  if (error) return <div className="p-8 text-red-400 text-center">{error}</div>;
  if (!analysis) return <div className="p-8 text-white/50 text-center">No analysis available. Click "Run Analysis" to generate metrics.</div>;
  if (analysis.status !== 'COMPLETED') return <div className="p-8 text-yellow-400 text-center">Analysis is currently {analysis.status}...</div>;

  const result = analysis.result;
  if (!result) return <div className="p-8 text-white/50 text-center">Analysis completed but no results were found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#12121e] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center">
          <Activity size={32} className="text-emerald-400 mb-2" />
          <div className="text-4xl font-bold text-white mb-1">{result.healthScore?.toFixed(0) || 0}</div>
          <div className="text-sm text-white/50 uppercase tracking-wider font-semibold">Health Score</div>
        </div>

        <div className="bg-[#12121e] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center">
          <CheckCircle2 size={32} className="text-blue-400 mb-2" />
          <div className="text-4xl font-bold text-white mb-1">{result.maintainabilityScore?.toFixed(0) || 0}</div>
          <div className="text-sm text-white/50 uppercase tracking-wider font-semibold">Maintainability</div>
        </div>

        <div className="bg-[#12121e] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center">
          <AlertTriangle size={32} className="text-amber-400 mb-2" />
          <div className="text-4xl font-bold text-white mb-1">{result.complexityScore?.toFixed(0) || 0}</div>
          <div className="text-sm text-white/50 uppercase tracking-wider font-semibold">Complexity Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#12121e] border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Code2 size={20} className="text-indigo-400" />
            Repository Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/60">Total Files Analyzed</span>
              <span className="text-white font-medium">{result.totalFiles}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/60">Total Lines of Code</span>
              <span className="text-white font-medium">{result.totalLines}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#12121e] border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Language Breakdown</h3>
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {Object.entries(result.languageBreakdown || {}).sort(([,a]: any, [,b]: any) => b - a).map(([lang, count]: any) => (
              <div key={lang} className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium text-white/80">{lang || 'Unknown'}</div>
                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${(count / result.totalFiles) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-right text-xs text-white/50">{((count / result.totalFiles) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CI/CD Intelligence Section */}
      <div className="bg-[#12121e] border border-white/10 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PlayCircle size={20} className="text-indigo-400" />
              CI/CD Pipeline Intelligence
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Continuous integration status, workflow run analytics, and health telemetry
            </p>
          </div>

          {onNavigateToCiCd && (
            <button
              onClick={onNavigateToCiCd}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <span>Explore CI/CD Workflows</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {ciHealth ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-black/20 border border-white/5">
              <span className="text-xs text-white/40 uppercase font-semibold">Status</span>
              <div className="mt-1 text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck size={16} />
                <span>{ciHealth.healthStatus}</span>
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                {ciHealth.activeWorkflowsCount} active workflows
              </div>
            </div>

            <div className="p-4 rounded-lg bg-black/20 border border-white/5">
              <span className="text-xs text-white/40 uppercase font-semibold">Success Rate</span>
              <div className="mt-1 text-lg font-bold text-white">
                {ciHealth.successRate}%
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                {ciHealth.successCount} passed / {ciHealth.totalRuns} runs
              </div>
            </div>

            <div className="p-4 rounded-lg bg-black/20 border border-white/5">
              <span className="text-xs text-white/40 uppercase font-semibold">Avg Duration</span>
              <div className="mt-1 text-lg font-bold text-cyan-400 flex items-center gap-1.5">
                <Clock size={16} />
                <span>{ciHealth.averageDurationSeconds}s</span>
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                MTTR: ~{ciHealth.mttrSeconds}s
              </div>
            </div>

            <div className="p-4 rounded-lg bg-black/20 border border-white/5">
              <span className="text-xs text-white/40 uppercase font-semibold">Latest Run</span>
              <div className="mt-1 text-sm font-semibold text-white truncate">
                {ciHealth.lastRun ? `#${ciHealth.lastRun.runNumber} ${ciHealth.lastRun.workflowName}` : 'None'}
              </div>
              <div className="text-[11px] text-white/40 mt-1 truncate">
                {ciHealth.lastRun ? `${ciHealth.lastRun.headBranch} (${ciHealth.lastRun.conclusion || ciHealth.lastRun.status})` : 'No runs recorded'}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-black/20 border border-white/5 text-xs text-white/40 flex items-center justify-between">
            <span>Loading CI/CD telemetry...</span>
            {onNavigateToCiCd && (
              <button onClick={onNavigateToCiCd} className="text-indigo-400 hover:underline">
                View CI/CD Hub
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
