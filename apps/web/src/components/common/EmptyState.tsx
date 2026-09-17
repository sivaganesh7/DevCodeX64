import React from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#12121e]/80 backdrop-blur-md p-10 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
        {icon || <FolderOpen size={32} />}
      </div>

      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-sm">
        {description}
      </p>

      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            actionHref ? (
              <Link
                to={actionHref}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                onClick={onAction}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
              >
                {actionLabel}
              </button>
            )
          )}

          {secondaryLabel && (
            secondaryHref ? (
              <Link
                to={secondaryHref}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                {secondaryLabel}
              </Link>
            ) : (
              <button
                onClick={onSecondaryAction}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                {secondaryLabel}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
