import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { dashboardApi, DashboardOverview } from './services/dashboardApi';

vi.mock('./services/dashboardApi', () => ({
  dashboardApi: {
    getOverview: vi.fn(),
  },
}));

describe('DashboardPage', () => {
  const mockOverview: DashboardOverview = {
    summary: {
      totalRepositories: 2,
      overallHealthScore: 91,
      totalVulnerabilities: 3,
      criticalVulnerabilities: 1,
      totalOpenPullRequests: 2,
      totalAnalysesCompleted: 10,
      totalGeneratedTests: 5,
      totalDocumentationArtifacts: 4,
      ciSuccessRate: 94,
    },
    repositories: [
      {
        id: 'repo-1',
        name: 'DevCodeX64',
        owner: 'sivaganesh7',
        fullName: 'sivaganesh7/DevCodeX64',
        isPrivate: false,
        language: 'TypeScript',
        defaultBranch: 'main',
        stars: 42,
        healthScore: 92,
        maintainabilityScore: 89,
        complexityScore: 15,
        vulnerabilitiesCount: { total: 1, critical: 0, high: 1 },
        openPrsCount: 2,
        ciStatus: 'HEALTHY',
        lastAnalyzedAt: '2026-09-17T12:00:00Z',
        updatedAt: '2026-09-17T12:00:00Z',
      },
      {
        id: 'repo-2',
        name: 'payment-service',
        owner: 'sivaganesh7',
        fullName: 'sivaganesh7/payment-service',
        isPrivate: true,
        language: 'Go',
        defaultBranch: 'main',
        stars: 10,
        healthScore: 88,
        maintainabilityScore: 85,
        complexityScore: 20,
        vulnerabilitiesCount: { total: 2, critical: 1, high: 1 },
        openPrsCount: 0,
        ciStatus: 'DEGRADED',
        lastAnalyzedAt: '2026-09-17T10:00:00Z',
        updatedAt: '2026-09-17T10:00:00Z',
      },
    ],
    recentActivity: [
      {
        id: 'act-1',
        type: 'PR_REVIEW',
        title: 'Automated PR Review: #41 feat: CI/CD',
        description: 'AI code review evaluated risk level as LOW.',
        repositoryName: 'DevCodeX64',
        repositoryOwner: 'sivaganesh7',
        timestamp: '2026-09-17T12:30:00Z',
        status: 'success',
        link: '/repositories/sivaganesh7/DevCodeX64/pull-requests',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (dashboardApi.getOverview as any).mockResolvedValue(mockOverview);
  });

  it('renders multi-repo dashboard overview metrics', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Engineering Dashboard')).toBeDefined();
    });

    expect(screen.getByText('91%')).toBeDefined();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('DevCodeX64')).toBeDefined();
    expect(screen.getByText('payment-service')).toBeDefined();
    expect(screen.getByText('Recent Cross-Repository Activity')).toBeDefined();
    expect(screen.getByText('Automated PR Review: #41 feat: CI/CD')).toBeDefined();
  });

  it('filters repositories using search input', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('DevCodeX64')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.change(searchInput, { target: { value: 'payment' } });

    expect(screen.queryByText('DevCodeX64')).toBeNull();
    expect(screen.getByText('payment-service')).toBeDefined();
  });

  it('shows empty state when no repositories match search query', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('DevCodeX64')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.change(searchInput, { target: { value: 'non-existent-repo-name' } });

    expect(screen.getByText('No Repositories Found')).toBeDefined();
  });
});
