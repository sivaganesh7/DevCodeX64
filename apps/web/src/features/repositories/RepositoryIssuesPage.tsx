import { useEffect, useState } from 'react';
import apiClient from '../../lib/api-client';
import { AlertTriangle, AlertCircle, Info, Filter } from 'lucide-react';

export function RepositoryIssuesPage({ owner, repo }: { owner: string; repo: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    setIsLoading(true);
    const query = filter !== 'ALL' ? `?severity=${filter}` : '';
    apiClient.get(`/repositories/${owner}/${repo}/analysis/issues${query}`)
      .then(res => setIssues(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [owner, repo, filter]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle size={16} className="text-red-500" />;
      case 'HIGH': return <AlertTriangle size={16} className="text-orange-500" />;
      case 'MEDIUM': return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Code Smells & Issues</h2>
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
          <Filter size={16} className="text-white/40 ml-2" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === s ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-white/50 animate-pulse">
          Loading issues...
        </div>
      ) : issues.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-white/50 border border-dashed border-white/10 rounded-xl bg-black/20">
          No issues found! Your code is pristine.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {issues.map(issue => (
            <div key={issue.id} className="bg-[#12121e] border border-white/10 rounded-xl p-4 flex gap-4 hover:border-white/20 transition-colors">
              <div className="mt-1">{getSeverityIcon(issue.severity)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-white/90">{issue.title}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getSeverityColor(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>
                <p className="text-sm text-white/60 mb-3">{issue.description}</p>
                <div className="flex items-center gap-3 text-xs text-white/40 font-mono bg-black/40 px-3 py-2 rounded-lg inline-flex">
                  <span>{issue.filePath}</span>
                  {issue.lineNumber && (
                    <>
                      <span className="w-px h-3 bg-white/20" />
                      <span>Line {issue.lineNumber}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
