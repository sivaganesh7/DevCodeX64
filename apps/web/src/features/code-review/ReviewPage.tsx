import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react';
import { CodeReviewWorkspace } from './components/CodeReviewWorkspace';

export const ReviewPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();

  if (!owner || !repo) {
    return (
      <div className="p-8 text-center text-white/50">
        Repository parameters missing from route.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d14] text-white p-6 md:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-white/50 mb-6 max-w-7xl mx-auto w-full">
        <Link
          to="/repositories"
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Repositories</span>
        </Link>
        <ChevronRight size={14} className="text-white/20" />
        <Link
          to={`/repositories/${owner}/${repo}`}
          className="hover:text-white transition-colors"
        >
          {owner}/{repo}
        </Link>
        <ChevronRight size={14} className="text-white/20" />
        <span className="text-indigo-400 font-medium flex items-center gap-1">
          <Sparkles size={12} /> Code Review
        </span>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full">
        <CodeReviewWorkspace owner={owner} repo={repo} />
      </div>
    </div>
  );
};
