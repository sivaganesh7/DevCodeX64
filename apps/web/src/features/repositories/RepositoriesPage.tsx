import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/api-client';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  language: string | null;
  updated_at: string;
}

export function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/github/repositories')
      .then(res => setRepositories(res.data))
      .catch(err => {
        if (err.response?.status === 404) {
          setError('GitHub account not connected. Please connect your GitHub account in Settings.');
        } else {
          setError('Failed to load repositories.');
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Repositories
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Manage and select repositories for analysis.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-white/8 bg-[#12121e] p-8 text-center text-white">
          <p className="text-white/70 mb-4">{error}</p>
          {error.includes('not connected') && (
            <Link
              to="/settings"
              className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Go to Settings
            </Link>
          )}
        </div>
      ) : isLoading ? (
        <div className="text-white/50 text-sm">Loading repositories...</div>
      ) : repositories.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-[#12121e] p-8 text-center text-white">
          <p className="text-white/70">No repositories found. You may need to grant access to more repositories in your GitHub App installation.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repositories.map(repo => (
            <Link 
              key={repo.id} 
              to={`/repositories/${repo.full_name}`}
              className="rounded-xl border border-white/8 bg-[#12121e] p-5 hover:border-indigo-500/50 hover:bg-white/5 transition-colors flex flex-col cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-white truncate pr-4" title={repo.full_name}>
                  {repo.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${repo.private ? 'bg-white/5 border-white/10 text-white/70' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  {repo.private ? 'Private' : 'Public'}
                </span>
              </div>
              <p className="text-sm text-white/50 line-clamp-2 mb-4 flex-grow">
                {repo.description || 'No description provided.'}
              </p>
              <div className="flex items-center justify-between text-xs text-white/40 mt-auto pt-4 border-t border-white/5">
                <span>{repo.language || 'Unknown'}</span>
                <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
