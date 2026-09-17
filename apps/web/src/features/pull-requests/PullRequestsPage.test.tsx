import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PullRequestsList } from './components/PullRequestsList';
import { PullRequestDetail } from './services/pullRequestsApi';

describe('Pull Request Components', () => {
  const samplePrs: PullRequestDetail[] = [
    {
      id: 'pr-1',
      repositoryId: 'repo-1',
      number: 101,
      title: 'feat: add jwt token refresh',
      state: 'open',
      author: 'dev-alice',
      baseBranch: 'main',
      headBranch: 'feature/jwt-refresh',
      htmlUrl: 'https://github.com/org/repo/pull/101',
      createdAt: '2026-09-17T12:00:00Z',
      updatedAt: '2026-09-17T12:00:00Z',
      latestReview: {
        id: 'rev-1',
        pullRequestId: 'pr-1',
        summary: 'Clean implementation, but check expiration boundary',
        riskLevel: 'LOW',
        issuesFound: 1,
        securityIssues: 0,
        postedToGithub: false,
        createdAt: '2026-09-17T12:05:00Z',
        updatedAt: '2026-09-17T12:05:00Z',
      },
    },
    {
      id: 'pr-2',
      repositoryId: 'repo-1',
      number: 102,
      title: 'fix: patch sql injection vulnerability',
      state: 'merged',
      author: 'dev-bob',
      baseBranch: 'main',
      headBranch: 'hotfix/sql-injection',
      createdAt: '2026-09-17T11:00:00Z',
      updatedAt: '2026-09-17T11:30:00Z',
      latestReview: {
        id: 'rev-2',
        pullRequestId: 'pr-2',
        summary: 'Critical security fix verified',
        riskLevel: 'HIGH',
        issuesFound: 2,
        securityIssues: 1,
        postedToGithub: true,
        createdAt: '2026-09-17T11:05:00Z',
        updatedAt: '2026-09-17T11:05:00Z',
      },
    },
  ];

  describe('PullRequestsList', () => {
    it('renders list of pull requests with numbers, titles, and risk badges', () => {
      const onSelect = vi.fn();
      const onAnalyze = vi.fn();

      render(
        <PullRequestsList
          pullRequests={samplePrs}
          loading={false}
          onSelectPr={onSelect}
          onAnalyzePr={onAnalyze}
        />,
      );

      expect(screen.getByText('feat: add jwt token refresh')).toBeDefined();
      expect(screen.getByText('#101')).toBeDefined();
      expect(screen.getByText('Low Risk')).toBeDefined();
      expect(screen.getByText('fix: patch sql injection vulnerability')).toBeDefined();
      expect(screen.getByText('#102')).toBeDefined();
      expect(screen.getByText('High Risk')).toBeDefined();
      expect(screen.getByText('Merged')).toBeDefined();
    });

    it('triggers PR selection when clicking a card', () => {
      const onSelect = vi.fn();

      render(
        <PullRequestsList
          pullRequests={samplePrs}
          loading={false}
          onSelectPr={onSelect}
        />,
      );

      fireEvent.click(screen.getByText('feat: add jwt token refresh'));
      expect(onSelect).toHaveBeenCalledWith(samplePrs[0]);
    });

    it('triggers onAnalyzePr when Analyze button is clicked', () => {
      const onSelect = vi.fn();
      const onAnalyze = vi.fn();

      render(
        <PullRequestsList
          pullRequests={samplePrs}
          loading={false}
          onSelectPr={onSelect}
          onAnalyzePr={onAnalyze}
        />,
      );

      const analyzeButtons = screen.getAllByTitle('Analyze PR with AI');
      expect(analyzeButtons.length).toBe(2);

      fireEvent.click(analyzeButtons[0]);
      expect(onAnalyze).toHaveBeenCalledWith(101);
    });

    it('renders empty state when no pull requests exist', () => {
      render(
        <PullRequestsList
          pullRequests={[]}
          loading={false}
          onSelectPr={vi.fn()}
        />,
      );

      expect(screen.getByText('No Pull Requests Found')).toBeDefined();
    });
  });
});
