import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../lib/api-client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type ProfileInput = z.infer<typeof profileSchema>;

export function SettingsPage() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // GitHub integration state
  const [githubStatus, setGithubStatus] = useState<{ connected: boolean; username: string | null } | null>(null);
  const [isLoadingGithub, setIsLoadingGithub] = useState(true);

  useEffect(() => {
    // Check for callback params
    if (searchParams.get('github_connected') === 'true') {
      setSuccess(true);
      // Clean up URL
      searchParams.delete('github_connected');
      setSearchParams(searchParams);
    } else if (searchParams.get('github_error') === 'true') {
      setError('Failed to connect GitHub account.');
      searchParams.delete('github_error');
      setSearchParams(searchParams);
    }

    // Fetch status
    apiClient.get('/github/status')
      .then(res => setGithubStatus(res.data))
      .catch(() => { /* ignore */ })
      .finally(() => setIsLoadingGithub(false));
  }, [searchParams, setSearchParams]);

  const handleConnectGitHub = async () => {
    try {
      const res = await apiClient.get('/github/install-url');
      window.location.href = res.data.url;
    } catch (err) {
      setError('Failed to initiate GitHub connection.');
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) return;
    try {
      await apiClient.delete('/github/disconnect');
      setGithubStatus({ connected: false, username: null });
    } catch (err) {
      setError('Failed to disconnect GitHub.');
    }
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    try {
      setSuccess(false);
      setError(null);
      await apiClient.patch('/users/me', data);
      setSuccess(true);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Manage your account settings
        </p>
      </div>

      <div className="rounded-xl border border-white/8 bg-[#12121e] p-6 text-white">
        <h2 className="text-lg font-medium mb-4">Profile Information</h2>
        
        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded text-sm">
            Profile updated successfully.
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white/50 sm:text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
            <input
              type="text"
              {...register('name')}
              className="block w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#12121e] disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-white/8 bg-[#12121e] p-6 text-white">
        <h2 className="text-lg font-medium mb-4">Connected Accounts</h2>
        
        <div className="flex items-center justify-between py-4 border-t border-white/10">
          <div>
            <h3 className="text-sm font-medium text-white">GitHub Integration</h3>
            <p className="text-sm text-white/50 mt-1">
              Connect your GitHub account to analyze repositories.
            </p>
          </div>
          <div>
            {isLoadingGithub ? (
              <span className="text-sm text-white/50">Loading...</span>
            ) : githubStatus?.connected ? (
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm text-emerald-400 font-medium">
                  Connected as {githubStatus.username}
                </span>
                <button
                  onClick={handleDisconnectGitHub}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGitHub}
                className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
              >
                Connect GitHub
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
