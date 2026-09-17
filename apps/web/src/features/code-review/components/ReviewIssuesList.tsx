import React, { useState } from 'react';
import {
  ReviewIssue,
  ReviewIssueSeverity,
  ReviewIssueCategory,
} from '../services/codeReviewApi';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  Filter,
} from 'lucide-react';

interface ReviewIssuesListProps {
  issues: ReviewIssue[];
  onSelectLine?: (filePath: string, line: number | null) => void;
}

export const ReviewIssuesList: React.FC<ReviewIssuesListProps> = ({
  issues,
  onSelectLine,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filteredIssues = issues.filter((issue) => {
    const matchesSeverity =
      selectedSeverity === 'ALL' || issue.severity === selectedSeverity;
    const matchesCategory =
      selectedCategory === 'ALL' || issue.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.file.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesCategory && matchesSearch;
  });

  const getSeverityBadge = (severity: ReviewIssueSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert size={13} /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle size={13} /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
            <AlertCircle size={13} /> MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Info size={13} /> LOW
          </span>
        );
    }
  };

  const getCategoryBadge = (category: ReviewIssueCategory) => {
    switch (category) {
      case 'SECURITY':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Security
          </span>
        );
      case 'PERFORMANCE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Performance
          </span>
        );
      case 'CORRECTNESS':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Correctness
          </span>
        );
      case 'MAINTAINABILITY':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Maintainability
          </span>
        );
      case 'STYLE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Style
          </span>
        );
    }
  };

  const copyRecommendation = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header and Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">
            Detected Findings ({filteredIssues.length} of {issues.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Severity Selector */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-[#12121e] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#12121e] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="SECURITY">Security</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="CORRECTNESS">Correctness</option>
            <option value="MAINTAINABILITY">Maintainability</option>
            <option value="STYLE">Style</option>
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#12121e] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 flex-1 sm:w-48"
          />
        </div>
      </div>

      {/* Issues Cards */}
      {filteredIssues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-white/50 bg-white/[0.01]">
          <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-400 opacity-80" />
          <p className="text-sm text-white/80 font-medium">No findings matching the selected filters</p>
          <p className="text-xs text-white/40 mt-1">Code conforms to standard quality rules in this selection.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredIssues.map((issue, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/10 bg-[#12121e]/80 hover:border-white/20 transition-all duration-150 p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  {getSeverityBadge(issue.severity)}
                  {getCategoryBadge(issue.category)}
                  <button
                    onClick={() => onSelectLine?.(issue.file, issue.line)}
                    className="flex items-center gap-1 font-mono text-xs text-indigo-400 hover:text-indigo-300 hover:underline bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20"
                  >
                    <Code2 size={13} />
                    <span>{issue.file}</span>
                    {issue.line && <span>:L{issue.line}</span>}
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-semibold text-white">{issue.title}</h4>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">{issue.description}</p>
              </div>

              {/* Recommendation Box */}
              <div className="mt-3 rounded-lg bg-black/40 border border-white/10 p-3">
                <div className="flex items-center justify-between text-xs text-indigo-300/90 font-medium mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" /> Suggested Fix / Recommendation:
                  </span>
                  <button
                    onClick={() => copyRecommendation(issue.recommendation, idx)}
                    className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-200 bg-white/[0.02] p-2 rounded border border-white/5 whitespace-pre-wrap break-words">
                  {issue.recommendation}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
