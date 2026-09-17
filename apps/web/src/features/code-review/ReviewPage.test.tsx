import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewSummaryCard } from './components/ReviewSummaryCard';
import { ReviewIssuesList } from './components/ReviewIssuesList';
import { ReviewPositivesAndRecs } from './components/ReviewPositivesAndRecs';
import { ReviewIssue } from './services/codeReviewApi';

describe('Code Review Components', () => {
  const sampleIssues: ReviewIssue[] = [
    {
      severity: 'CRITICAL',
      category: 'SECURITY',
      title: 'Hardcoded secret token',
      description: 'API key found in cleartext assignment',
      file: 'src/auth/jwt.ts',
      line: 14,
      recommendation: 'Use process.env.JWT_SECRET instead.',
    },
    {
      severity: 'MEDIUM',
      category: 'CORRECTNESS',
      title: 'Swallowed error in catch block',
      description: 'Empty catch block suppresses runtime exceptions',
      file: 'src/auth/jwt.ts',
      line: 28,
      recommendation: 'Log or re-throw the error.',
    },
    {
      severity: 'LOW',
      category: 'STYLE',
      title: 'Loose any type',
      description: 'Avoid using any in TypeScript declarations',
      file: 'src/auth/jwt.ts',
      line: 5,
      recommendation: 'Replace any with unknown or typed interface.',
    },
  ];

  describe('ReviewSummaryCard', () => {
    it('renders overall rating badge and summary narrative', () => {
      render(
        <ReviewSummaryCard
          overallRating="NEEDS_WORK"
          summary="Several vulnerabilities were flagged that require remediation."
          issues={sampleIssues}
          reviewType="FILE"
          targetLabel="src/auth/jwt.ts"
        />,
      );

      expect(screen.getByText('NEEDS WORK')).toBeDefined();
      expect(
        screen.getByText('Several vulnerabilities were flagged that require remediation.'),
      ).toBeDefined();
      expect(screen.getByText('src/auth/jwt.ts')).toBeDefined();
      // Counters: 1 critical, 0 high, 1 medium, 1 low
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ReviewIssuesList', () => {
    it('renders findings and supports severity filtering', () => {
      render(<ReviewIssuesList issues={sampleIssues} />);

      expect(screen.getByText('Hardcoded secret token')).toBeDefined();
      expect(screen.getByText('Swallowed error in catch block')).toBeDefined();
      expect(screen.getByText('Loose any type')).toBeDefined();

      // Filter by Critical
      const severitySelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(severitySelect, { target: { value: 'CRITICAL' } });

      expect(screen.getByText('Hardcoded secret token')).toBeDefined();
      expect(screen.queryByText('Swallowed error in catch block')).toBeNull();
      expect(screen.queryByText('Loose any type')).toBeNull();
    });
  });

  describe('ReviewPositivesAndRecs', () => {
    it('renders strengths and prioritized recommendations', () => {
      const positives = ['Clean asynchronous async/await flow'];
      const recs = ['Move secrets to environment variables', 'Add unit tests'];

      render(<ReviewPositivesAndRecs positives={positives} recommendations={recs} />);

      expect(screen.getByText('Clean asynchronous async/await flow')).toBeDefined();
      expect(screen.getByText('Move secrets to environment variables')).toBeDefined();
      expect(screen.getByText('Add unit tests')).toBeDefined();
    });
  });
});
