import React, { useState, useEffect } from 'react';
import {
  FileCode,
  GitPullRequest,
  Sparkles,
  Loader2,
  Clock,
  AlertTriangle,
  Share2,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import {
  codeReviewApi,
  ReviewResultResponse,
  SavedReviewItem,
} from '../services/codeReviewApi';
import { ReviewSummaryCard } from './ReviewSummaryCard';
import { ReviewIssuesList } from './ReviewIssuesList';
import { ReviewPositivesAndRecs } from './ReviewPositivesAndRecs';

interface CodeReviewWorkspaceProps {
  owner: string;
  repo: string;
  initialFilePath?: string;
  onOpenFile?: (filePath: string) => void;
}

export const CodeReviewWorkspace: React.FC<CodeReviewWorkspaceProps> = ({
  owner,
  repo,
  initialFilePath,
  onOpenFile,
}) => {
  const [reviewMode, setReviewMode] = useState<'FILE' | 'PR'>('FILE');

  // File Review Form State
  const [filePath, setFilePath] = useState(initialFilePath || 'src/auth/auth.service.ts');
  const [fileContent, setFileContent] = useState('');
  const [useCustomContent, setUseCustomContent] = useState(false);

  // PR Review Form State
  const [prNumber, setPrNumber] = useState<number | ''>(1);
  const [prDiff, setPrDiff] = useState('');
  const [prTitle, setPrTitle] = useState('feat(auth): add OAuth and token refresh');

  // Execution & Output State
  const [isRunning, setIsRunning] = useState(false);
  const [runStep, setRunStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentReview, setCurrentReview] = useState<ReviewResultResponse | null>(null);

  // History State
  const [history, setHistory] = useState<SavedReviewItem[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  useEffect(() => {
    if (initialFilePath) {
      setFilePath(initialFilePath);
    }
  }, [initialFilePath]);

  // Load Review History on Mount
  const fetchHistory = async () => {
    try {
      const items = await codeReviewApi.getReviews(owner, repo);
      setHistory(items);
      if (items.length > 0 && !currentReview) {
        const latest = items[0];
        setCurrentReview({
          id: latest.id,
          repositoryId: latest.repositoryId,
          reviewType: latest.reviewType,
          filePath: latest.filePath || undefined,
          pullRequestNumber: latest.prNumber || undefined,
          summary: latest.summary,
          overallRating: latest.overallRating,
          issues: latest.reviewData.issues,
          positives: latest.reviewData.positives,
          recommendations: latest.reviewData.recommendations,
          createdAt: latest.createdAt,
        });
      }
    } catch (err: any) {
      console.warn('Could not load review history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [owner, repo]);

  // Quick Demo Prefills
  const prefillSampleFile = (type: 'clean' | 'risky') => {
    setReviewMode('FILE');
    setUseCustomContent(true);

    if (type === 'risky') {
      setFilePath('src/services/payment.service.ts');
      setFileContent(`import axios from "axios";

export class PaymentService {
  // Hardcoded test secret
  private apiKey = "sk-live-9823487239482394";

  async processTransaction(amount: any, targetUser: any) {
    try {
      console.log("DEBUG: executing payment", amount, targetUser);
      // Insecure eval for formula calculation
      const computedFee = eval("amount * 0.025");
      return { success: true, fee: computedFee };
    } catch (err) {
      // Swallowed error
    }
  }
}`);
    } else {
      setFilePath('src/utils/crypto.ts');
      setFileContent(`import { createHash, randomBytes } from "crypto";

export interface HashResult {
  hash: string;
  salt: string;
}

/**
 * Computes cryptographically secure hash for input buffer
 */
export function hashWithSalt(data: string): HashResult {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(data + salt).digest("hex");
  return { hash, salt };
}`);
    }
  };

  const prefillSamplePrDiff = () => {
    setReviewMode('PR');
    setPrNumber(42);
    setPrTitle('Refactor Token Generation and Session Cache');
    setPrDiff(`diff --git a/src/auth/jwt.service.ts b/src/auth/jwt.service.ts
index 83a1b2c..f4d9e01 100644
--- a/src/auth/jwt.service.ts
+++ b/src/auth/jwt.service.ts
@@ -10,8 +10,12 @@ export class JwtService {
-  verifyToken(token: string): boolean {
-    return jwt.verify(token, process.env.JWT_SECRET);
+  verifyToken(token: any): boolean {
+    try {
+      console.log("DEBUG token verify", token);
+      return jwt.verify(token, "hardcoded-secret-key-12345");
+    } catch () {
+      return false;
+    }
   }`);
  };

  // Run AI Review
  const handleExecuteReview = async () => {
    setIsRunning(true);
    setError(null);
    setRunStep('Analyzing AST & code structure...');

    try {
      setTimeout(() => {
        setRunStep('Evaluating security, correctness, and ML risk context...');
      }, 700);

      setTimeout(() => {
        setRunStep('Synthesizing structured code review output...');
      }, 1400);

      let result: ReviewResultResponse;

      if (reviewMode === 'FILE') {
        result = await codeReviewApi.reviewFile(owner, repo, {
          filePath: filePath.trim(),
          content: useCustomContent && fileContent.trim() ? fileContent : undefined,
        });
      } else {
        result = await codeReviewApi.reviewPr(owner, repo, {
          pullRequestNumber: prNumber ? Number(prNumber) : undefined,
          diff: prDiff.trim() ? prDiff : undefined,
          title: prTitle,
        });
      }

      setCurrentReview(result);
      fetchHistory();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to execute AI code review. Please check connection and target parameters.',
      );
    } finally {
      setIsRunning(false);
      setRunStep('');
    }
  };

  // Copy entire review as Markdown for PR / GitHub comments
  const handleExportMarkdown = () => {
    if (!currentReview) return;

    let md = `## 🤖 AI Code Review Summary\n\n`;
    md += `**Overall Assessment:** \`${currentReview.overallRating}\`\n\n`;
    md += `${currentReview.summary}\n\n`;

    if (currentReview.issues.length > 0) {
      md += `### ⚠️ Findings & Issues (${currentReview.issues.length})\n\n`;
      currentReview.issues.forEach((issue) => {
        md += `- **[${issue.severity}] ${issue.title}** (${issue.category})\n`;
        md += `  - Location: \`${issue.file}${issue.line ? `:${issue.line}` : ''}\`\n`;
        md += `  - Details: ${issue.description}\n`;
        md += `  - *Recommendation:* ${issue.recommendation}\n\n`;
      });
    }

    if (currentReview.positives.length > 0) {
      md += `### ✅ Strengths Observed\n\n`;
      currentReview.positives.forEach((pos) => {
        md += `- ${pos}\n`;
      });
      md += `\n`;
    }

    if (currentReview.recommendations.length > 0) {
      md += `### 💡 Strategic Recommendations\n\n`;
      currentReview.recommendations.forEach((rec, idx) => {
        md += `${idx + 1}. ${rec}\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Top Header / Mode Switcher / History Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border border-white/10 bg-[#12121e]/90 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <Sparkles size={16} /> Phase 9 Intelligence
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Intelligent Code Review</h1>
          <p className="text-xs text-white/50 mt-0.5">
            Automated, schema-validated code reviews for single files and pull request diffs.
          </p>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center p-1 rounded-xl bg-white/[0.05] border border-white/10">
            <button
              onClick={() => setReviewMode('FILE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                reviewMode === 'FILE'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <FileCode size={16} /> File Review
            </button>
            <button
              onClick={() => setReviewMode('PR')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                reviewMode === 'PR'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <GitPullRequest size={16} /> PR Diff Review
            </button>
          </div>

          {/* History Drawer Toggle */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-white/80 transition-colors"
            title="View past reviews"
          >
            <History size={16} className="text-indigo-400" />
            <span>History ({history.length})</span>
            {showHistoryDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* History Drawer Dropdown */}
      {showHistoryDrawer && (
        <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d14] shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Repository Review History
            </h3>
            <span className="text-xs text-white/40">{history.length} reviews saved</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-white/40 py-4 text-center">No reviews performed yet for this repo.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 max-h-60 overflow-y-auto pr-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentReview({
                      id: item.id,
                      repositoryId: item.repositoryId,
                      reviewType: item.reviewType,
                      filePath: item.filePath || undefined,
                      pullRequestNumber: item.prNumber || undefined,
                      summary: item.summary,
                      overallRating: item.overallRating,
                      issues: item.reviewData.issues,
                      positives: item.reviewData.positives,
                      recommendations: item.reviewData.recommendations,
                      createdAt: item.createdAt,
                    });
                    setShowHistoryDrawer(false);
                  }}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    currentReview?.id === item.id
                      ? 'border-indigo-500/60 bg-indigo-500/10'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white">
                      {item.reviewType === 'PR' ? `PR #${item.prNumber}` : item.filePath?.split('/').pop()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.overallRating === 'EXCELLENT'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : item.overallRating === 'GOOD'
                          ? 'text-blue-400 bg-blue-500/10'
                          : item.overallRating === 'NEEDS_WORK'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {item.overallRating}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 line-clamp-1">{item.summary}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
                    <Clock size={11} />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>• {item.issuesCount} findings</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Setup Configuration Box */}
      <div className="rounded-2xl border border-white/10 bg-[#12121e]/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-white">
              {reviewMode === 'FILE' ? 'File Review Target' : 'Pull Request Review Target'}
            </h2>
            <p className="text-xs text-white/50">
              {reviewMode === 'FILE'
                ? 'Specify a repository file path or paste custom code to review.'
                : 'Specify a GitHub PR number or paste a unified git diff.'}
            </p>
          </div>

          {/* Prefill helpers */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/40">Demo samples:</span>
            {reviewMode === 'FILE' ? (
              <>
                <button
                  type="button"
                  onClick={() => prefillSampleFile('risky')}
                  className="px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-500/25 transition-colors"
                >
                  ⚡ Flawed Code
                </button>
                <button
                  type="button"
                  onClick={() => prefillSampleFile('clean')}
                  className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-500/25 transition-colors"
                >
                  ✨ Clean Code
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={prefillSamplePrDiff}
                className="px-2.5 py-1 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs hover:bg-indigo-500/25 transition-colors"
              >
                ⚡ Sample PR Diff
              </button>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-5 flex flex-col gap-4">
          {reviewMode === 'FILE' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Target File Path
                </label>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="e.g. src/auth/auth.service.ts"
                  className="w-full bg-[#0d0d14] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white/80">
                    Source Code Content (Optional override / snippet)
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomContent(!useCustomContent)}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    {useCustomContent ? 'Use Database Indexed File' : 'Paste Custom Code'}
                  </button>
                </div>
                {useCustomContent && (
                  <textarea
                    rows={8}
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    placeholder="// Paste source code to review here..."
                    className="w-full bg-[#0d0d14] border border-white/15 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-white/30 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    PR Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prNumber}
                    onChange={(e) => setPrNumber(e.target.value ? parseInt(e.target.value, 10) : '')}
                    placeholder="e.g. 42"
                    className="w-full bg-[#0d0d14] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    PR Title / Context
                  </label>
                  <input
                    type="text"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    placeholder="e.g. feat: add authentication token rotation"
                    className="w-full bg-[#0d0d14] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Unified Git Diff (Required if not synced with GitHub App)
                </label>
                <textarea
                  rows={8}
                  value={prDiff}
                  onChange={(e) => setPrDiff(e.target.value)}
                  placeholder="diff --git a/src/app.ts b/src/app.ts&#10;--- a/src/app.ts&#10;+++ b/src/app.ts&#10;@@ -1,3 +1,4 @@..."
                  className="w-full bg-[#0d0d14] border border-white/15 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-white/30 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            </>
          )}

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/5">
            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-xs">
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
            )}
            {!error && <div />}

            <button
              onClick={handleExecuteReview}
              disabled={isRunning}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold text-sm shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2.5 transition-all duration-200"
            >
              {isRunning ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{runStep || 'Running AI Code Review...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Run AI Code Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Review Results Display */}
      {currentReview ? (
        <div className="flex flex-col gap-6">
          {/* Top Actions: Export / Clear */}
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Active Review Assessment
            </h3>
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Share2 size={14} />
              <span>{copiedExport ? 'Copied Markdown!' : 'Export as GitHub Comment'}</span>
            </button>
          </div>

          <ReviewSummaryCard
            overallRating={currentReview.overallRating}
            summary={currentReview.summary}
            issues={currentReview.issues}
            reviewType={currentReview.reviewType}
            targetLabel={
              currentReview.reviewType === 'PR'
                ? `PR #${currentReview.pullRequestNumber || 'Diff'}`
                : currentReview.filePath
            }
            createdAt={currentReview.createdAt}
          />

          <ReviewPositivesAndRecs
            positives={currentReview.positives}
            recommendations={currentReview.recommendations}
          />

          <ReviewIssuesList
            issues={currentReview.issues}
            onSelectLine={(file, _line) => {
              if (onOpenFile) {
                onOpenFile(file);
              }
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#12121e]/40 p-12 text-center text-white/40 flex flex-col items-center gap-3">
          <FileCode size={40} className="text-indigo-400/50" />
          <div>
            <h4 className="text-sm font-semibold text-white/80">No Review Loaded</h4>
            <p className="text-xs text-white/40 mt-1">
              Select a file or PR diff above and click "Run AI Code Review" to generate an authoritative assessment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
