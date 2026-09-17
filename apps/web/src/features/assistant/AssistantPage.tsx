import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AssistantChat } from './components/AssistantChat';

export const AssistantPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();

  if (!owner || !repo) {
    return (
      <div className="p-8 text-center text-white/50">
        Repository parameters missing. Please select a repository first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={`/repositories/${owner}/${repo}`}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {owner} / {repo}
          </h1>
          <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">
            AI Codebase Assistant
          </p>
        </div>
      </div>

      <AssistantChat owner={owner} repo={repo} />
    </div>
  );
};
