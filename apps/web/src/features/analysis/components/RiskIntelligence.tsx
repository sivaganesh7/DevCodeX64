import { useEffect, useState } from 'react';
import { ShieldAlert, Activity, FileWarning, Search } from 'lucide-react';
import apiClient from '../../../lib/api-client';

interface RiskFactor {
  id: string;
  feature: string;
  impact: string;
  value: number;
}

interface RiskPrediction {
  id: string;
  riskProbability: number;
  riskLevel: string;
  file: {
    name: string;
    path: string;
  };
  factors: RiskFactor[];
}

export function RiskIntelligence({ owner, repo }: { owner: string; repo: string }) {
  const [overview, setOverview] = useState<any>(null);
  const [files, setFiles] = useState<RiskPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setIsLoading(true);
        // First get the latest analysis job
        const analysisRes = await apiClient.get(`/repositories/${owner}/${repo}/analysis/latest`);
        const analysisId = analysisRes.data?.id;

        if (!analysisId) {
          setError('No analysis found for this repository.');
          return;
        }

        // Fetch risk overview
        const overviewRes = await apiClient.get(`/analyses/${analysisId}/risk`);
        setOverview(overviewRes.data);

        // Fetch risk files
        const filesRes = await apiClient.get(`/analyses/${analysisId}/risk/files`);
        setFiles(filesRes.data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load risk intelligence data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiskData();
  }, [owner, repo]);

  if (isLoading) return <div className="p-8 text-white/50 text-center animate-pulse">Loading Risk Intelligence...</div>;
  if (error) return <div className="p-8 text-red-400 text-center">{error}</div>;
  if (!overview) return <div className="p-8 text-white/50 text-center">No risk data available.</div>;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'LOW': return 'text-emerald-500';
      default: return 'text-white/50';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'LOW': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="text-indigo-400" size={24} />
        <h2 className="text-2xl font-bold text-white">ML Risk Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`border rounded-xl p-6 flex flex-col items-center justify-center ${getRiskBg(overview.riskLevel)}`}>
          <ShieldAlert size={32} className={`mb-2 ${getRiskColor(overview.riskLevel)}`} />
          <div className="text-3xl font-bold text-white mb-1">{overview.riskLevel}</div>
          <div className="text-sm text-white/50 uppercase tracking-wider font-semibold">Repository Risk Level</div>
        </div>

        <div className="bg-[#12121e] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center">
          <Activity size={32} className="text-blue-400 mb-2" />
          <div className="text-3xl font-bold text-white mb-1">{(overview.averageRiskProbability * 100).toFixed(1)}%</div>
          <div className="text-sm text-white/50 uppercase tracking-wider font-semibold">Average Risk Probability</div>
        </div>

        <div className="bg-[#12121e] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center">
          <FileWarning size={32} className="text-amber-400 mb-2" />
          <div className="text-3xl font-bold text-white mb-1">{overview.highRiskFiles}</div>
          <div className="text-sm text-white/50 uppercase tracking-wider font-semibold">High Risk Files</div>
        </div>
      </div>

      <div className="bg-[#12121e] border border-white/10 rounded-xl overflow-hidden mt-8">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-lg text-white">File Risk Predictions</h3>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Search size={16} />
            <span>{files.length} files analyzed</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-xs uppercase tracking-wider text-white/50">
                <th className="p-4 font-medium">File Path</th>
                <th className="p-4 font-medium text-center">Probability</th>
                <th className="p-4 font-medium">Risk Level</th>
                <th className="p-4 font-medium">Top Factors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {files.map(file => (
                <tr key={file.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm text-white/80 font-mono truncate max-w-xs" title={file.file.path}>
                    {file.file.path}
                  </td>
                  <td className="p-4 text-sm font-bold text-center">
                    {(file.riskProbability * 100).toFixed(0)}%
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getRiskBg(file.riskLevel)} ${getRiskColor(file.riskLevel)}`}>
                      {file.riskLevel}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {file.factors.slice(0, 3).map((factor, idx) => (
                        <span key={idx} className="text-xs bg-white/10 px-2 py-1 rounded text-white/70">
                          {factor.feature}: <span className={getRiskColor(factor.impact)}>{factor.impact}</span>
                        </span>
                      ))}
                      {file.factors.length > 3 && (
                        <span className="text-xs bg-white/5 px-2 py-1 rounded text-white/40">+{file.factors.length - 3} more</span>
                      )}
                      {file.factors.length === 0 && (
                        <span className="text-xs text-white/30">None</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-white/50">No files found with risk predictions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
