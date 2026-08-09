import { useEffect, useState } from 'react';
import apiClient from '../../lib/api-client';
import { Activity, Code2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function RepositoryOverviewPage({ owner, repo }: { owner: string; repo: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysis, setAnalysis] = useState<any>(null);
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
    </div>
  );
}
