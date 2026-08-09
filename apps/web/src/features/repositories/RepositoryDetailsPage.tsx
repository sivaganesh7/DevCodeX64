import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../lib/api-client';
import { Folder, File, ArrowLeft, ChevronRight, Play, Loader2, AlertCircle, Activity, LayoutDashboard, Bug, Shield } from 'lucide-react';
import { RepositoryOverviewPage } from './RepositoryOverviewPage';
import { RepositoryIssuesPage } from './RepositoryIssuesPage';
import { SecurityOverview } from '../security/SecurityOverview';
import { DependenciesList } from '../security/DependenciesList';
import { VulnerabilitiesList } from '../security/VulnerabilitiesList';
import { SecretsList } from '../security/SecretsList';

interface TreeItem {
  path: string;
  mode: string;
  type: 'tree' | 'blob';
  sha: string;
  size?: number;
  url: string;
}

interface FileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
}

export function RepositoryDetailsPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPath, setCurrentPath] = useState<string>('');
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ingestionJob, setIngestionJob] = useState<any>(null);
  const [isStartingIngestion, setIsStartingIngestion] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysisJob, setAnalysisJob] = useState<any>(null);
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);

  const [activeTab, setActiveTab] = useState<'FILES' | 'OVERVIEW' | 'ISSUES' | 'SECURITY'>('FILES');

  useEffect(() => {
    if (!owner || !repo) return;
    setIsLoading(true);
    apiClient.get(`/github/repositories/${owner}/${repo}/tree?branch=main`) // hardcoded branch for Phase 3 simplicity, could be fetched from repo details
      .then(res => setTree(res.data))
      .catch(() => setError('Failed to load repository tree. Check if the default branch is main or the repository is accessible.'))
      .finally(() => setIsLoading(false));
  }, [owner, repo]);

  useEffect(() => {
    let timeoutId: number;
    if (ingestionJob && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(ingestionJob.status)) {
      const poll = () => {
        apiClient.get(`/ingestion/job/${ingestionJob.id}`)
          .then(res => setIngestionJob(res.data))
          .catch(console.error)
          .finally(() => {
            timeoutId = window.setTimeout(poll, 2000);
          });
      };
      timeoutId = window.setTimeout(poll, 2000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingestionJob?.id, ingestionJob?.status]);

  useEffect(() => {
    let timeoutId: number;
    if (analysisJob && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(analysisJob.status)) {
      const poll = () => {
        apiClient.get(`/repositories/${owner}/${repo}/analysis/latest`)
          .then(res => setAnalysisJob(res.data))
          .catch(console.error)
          .finally(() => {
            timeoutId = window.setTimeout(poll, 2000);
          });
      };
      timeoutId = window.setTimeout(poll, 2000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisJob?.id, analysisJob?.status]);

  const handleStartIngestion = async () => {
    setIsStartingIngestion(true);
    try {
      const res = await apiClient.post(`/repositories/${owner}/${repo}/ingest`);
      setIngestionJob(res.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.status === 409) {
        alert('An ingestion job is already running for this repository.');
      } else {
        alert('Failed to start ingestion: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setIsStartingIngestion(false);
    }
  };

  const handleStartAnalysis = async () => {
    setIsStartingAnalysis(true);
    try {
      const res = await apiClient.post(`/repositories/${owner}/${repo}/analysis`);
      setAnalysisJob(res.data);
      setActiveTab('OVERVIEW');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.status === 409) {
        alert('An analysis job is already running or repository is empty.');
      } else {
        alert('Failed to start analysis: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setIsStartingAnalysis(false);
    }
  };

  const handleFileClick = (path: string) => {
    setSelectedFile(path);
    setIsFileLoading(true);
    setFileError(null);
    setFileContent(null);
    
    apiClient.get(`/github/repositories/${owner}/${repo}/contents?path=${encodeURIComponent(path)}&branch=main`)
      .then(res => setFileContent(res.data))
      .catch(err => {
        if (err.response?.data?.message?.includes('too large') || err.response?.status === 403) {
          setFileError('File is too large for preview or access was denied.');
        } else {
          setFileError('Failed to load file contents. Binary files are not supported.');
        }
      })
      .finally(() => setIsFileLoading(false));
  };

  // Basic rendering of base64 content
  const renderContent = () => {
    if (fileError) return <div className="p-4 text-red-400">{fileError}</div>;
    if (isFileLoading) return <div className="p-4 text-white/50">Loading file...</div>;
    if (!fileContent) return <div className="p-4 text-white/50">Select a file to view contents</div>;

    if (fileContent.encoding === 'base64') {
      try {
        const decoded = atob(fileContent.content);
        // Very basic check if it's printable text
        // eslint-disable-next-line no-control-regex
        if (/[\x00-\x08\x0E-\x1F]/.test(decoded)) {
          return <div className="p-4 text-yellow-400">File type is not supported for preview (Binary file).</div>;
        }
        return (
          <pre className="p-4 overflow-auto text-sm font-mono text-white/80 bg-[#0a0a0f] rounded-lg">
            {decoded}
          </pre>
        );
      } catch (e) {
        return <div className="p-4 text-red-400">Failed to decode file contents.</div>;
      }
    }
    
    return <div className="p-4 text-yellow-400">File type is not supported for preview.</div>;
  };

  // Build current directory view
  const currentDirItems = tree.filter(item => {
    if (currentPath === '') {
      return !item.path.includes('/');
    } else {
      return item.path.startsWith(currentPath + '/') && !item.path.slice(currentPath.length + 1).includes('/');
    }
  }).sort((a, b) => {
    if (a.type === b.type) return a.path.localeCompare(b.path);
    return a.type === 'tree' ? -1 : 1; // folders first
  });

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/repositories" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {owner} / {repo}
            </h1>
            <p className="text-xs text-white/50 mt-1 uppercase tracking-wider font-semibold">READ-ONLY MODE</p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            {!ingestionJob && (
              <button
                onClick={handleStartIngestion}
                disabled={isStartingIngestion}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isStartingIngestion ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Sync Repository
              </button>
            )}
            
            {(ingestionJob?.status === 'COMPLETED' && !analysisJob) && (
              <button
                onClick={handleStartAnalysis}
                disabled={isStartingAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isStartingAnalysis ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                Run Analysis
              </button>
            )}
          </div>

          {ingestionJob && ingestionJob.status !== 'COMPLETED' && (
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm mt-2">
              <div className="flex items-center gap-2">
                {['PENDING', 'QUEUED', 'PROCESSING'].includes(ingestionJob.status) && <Loader2 size={16} className="text-indigo-400 animate-spin" />}
                {['FAILED', 'CANCELLED'].includes(ingestionJob.status) && <AlertCircle size={16} className="text-red-400" />}
                <span className="text-white/80 font-medium">Sync: {ingestionJob.status}</span>
              </div>
            </div>
          )}

          {analysisJob && analysisJob.status !== 'COMPLETED' && (
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm mt-2">
              <div className="flex items-center gap-2">
                {['PENDING', 'QUEUED', 'PROCESSING'].includes(analysisJob.status) && <Loader2 size={16} className="text-emerald-400 animate-spin" />}
                {['FAILED', 'CANCELLED'].includes(analysisJob.status) && <AlertCircle size={16} className="text-red-400" />}
                <span className="text-white/80 font-medium">Analysis: {analysisJob.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-white/10 mb-6 px-2">
        <button
          onClick={() => setActiveTab('FILES')}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'FILES' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-white/50 hover:text-white'}`}
        >
          <Folder size={16} /> Files
        </button>
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'OVERVIEW' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-white/50 hover:text-white'}`}
        >
          <LayoutDashboard size={16} /> Overview
        </button>
        <button
          onClick={() => setActiveTab('ISSUES')}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'ISSUES' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-white/50 hover:text-white'}`}
        >
          <Bug size={16} /> Issues
        </button>
        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'SECURITY' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-white/50 hover:text-white'}`}
        >
          <Shield size={16} /> Security
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          {error}
        </div>
      ) : isLoading ? (
        <div className="text-white/50">Loading tree...</div>
      ) : (
        <div className="flex-1 min-h-0">
          {activeTab === 'FILES' && (
            <div className="flex gap-6 h-full min-h-0">
              {/* File Explorer */}
              <div className="w-1/3 border border-white/10 rounded-xl bg-[#12121e] flex flex-col min-h-0 overflow-hidden">
                {/* Breadcrumb */}
                <div className="p-3 border-b border-white/10 flex items-center gap-1 overflow-x-auto text-sm text-white/70 whitespace-nowrap bg-black/20">
                  <button 
                    onClick={() => setCurrentPath('')}
                    className="hover:text-white transition-colors"
                  >
                    root
                  </button>
                  {pathParts.map((part, idx) => {
                    const targetPath = pathParts.slice(0, idx + 1).join('/');
                    return (
                      <div key={targetPath} className="flex items-center gap-1">
                        <ChevronRight size={14} className="text-white/30" />
                        <button 
                          onClick={() => setCurrentPath(targetPath)}
                          className="hover:text-white transition-colors"
                        >
                          {part}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto p-2">
                  {currentPath !== '' && (
                    <button
                      onClick={() => setCurrentPath(pathParts.slice(0, -1).join('/'))}
                      className="flex items-center gap-2 w-full p-2 text-sm text-white/70 hover:bg-white/5 rounded transition-colors text-left"
                    >
                      <Folder size={16} className="text-blue-400" />
                      <span>..</span>
                    </button>
                  )}
                  {currentDirItems.map(item => (
                    <button
                      key={item.path}
                      onClick={() => {
                        if (item.type === 'tree') {
                          setCurrentPath(item.path);
                        } else {
                          handleFileClick(item.path);
                        }
                      }}
                      className={`flex items-center gap-2 w-full p-2 text-sm rounded transition-colors text-left ${
                        selectedFile === item.path ? 'bg-indigo-600/20 text-indigo-400' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {item.type === 'tree' ? (
                        <Folder size={16} className="text-blue-400 shrink-0" />
                      ) : (
                        <File size={16} className="text-white/40 shrink-0" />
                      )}
                      <span className="truncate">
                        {item.path.split('/').pop()}
                      </span>
                    </button>
                  ))}
                  {currentDirItems.length === 0 && (
                    <div className="p-4 text-center text-sm text-white/30">Empty directory</div>
                  )}
                </div>
              </div>

              {/* File Viewer */}
              <div className="flex-1 border border-white/10 rounded-xl bg-[#12121e] flex flex-col min-h-0 overflow-hidden">
                <div className="p-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
                  <span className="text-sm font-medium text-white/80 truncate">
                    {selectedFile ? selectedFile : 'No file selected'}
                  </span>
                  {selectedFile && <span className="text-xs text-white/30 px-2 py-1 rounded bg-white/5">READ-ONLY</span>}
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                  {renderContent()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'OVERVIEW' && (
            <RepositoryOverviewPage owner={owner!} repo={repo!} />
          )}

          {activeTab === 'ISSUES' && (
            <RepositoryIssuesPage owner={owner!} repo={repo!} />
          )}

          {activeTab === 'SECURITY' && (
            <div className="flex flex-col gap-8 p-4 overflow-y-auto h-full">
              <SecurityOverview owner={owner!} repo={repo!} />
              <hr className="border-white/10" />
              <VulnerabilitiesList owner={owner!} repo={repo!} />
              <hr className="border-white/10" />
              <SecretsList owner={owner!} repo={repo!} />
              <hr className="border-white/10" />
              <DependenciesList owner={owner!} repo={repo!} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
