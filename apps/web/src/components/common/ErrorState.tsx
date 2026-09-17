import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeLink?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load data from the server. Please check your connection and try again.',
  onRetry,
  homeLink = true,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
        <AlertCircle size={28} />
      </div>

      <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
      <p className="text-xs text-white/60 leading-relaxed mb-6 max-w-xs">
        {message}
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <RotateCw size={13} />
            <span>Retry Action</span>
          </button>
        )}

        {homeLink && (
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
};
