import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneratedTestsList } from './components/GeneratedTestsList';
import { GeneratedTest } from './services/testGenerationApi';

describe('Test Generation Components', () => {
  const sampleTests: GeneratedTest[] = [
    {
      id: 'test-1',
      repositoryId: 'repo-1',
      filePath: 'src/utils/math.ts',
      functionName: 'calculateTax',
      testContent: 'describe("calculateTax", () => { it("happy path", () => {}); });',
      language: 'typescript',
      framework: 'jest',
      executionStatus: 'passed',
      executionOutput: 'PASS src/utils/math.test.ts',
      testCases: [
        {
          name: 'should calculate standard tax rate',
          description: 'Happy path standard multiplier',
          category: 'HAPPY_PATH',
        },
        {
          name: 'should handle zero income',
          description: 'Boundary zero condition',
          category: 'BOUNDARY',
        },
      ],
      executedAt: '2026-09-17T12:00:00Z',
      createdAt: '2026-09-17T11:55:00Z',
      updatedAt: '2026-09-17T12:00:00Z',
    },
    {
      id: 'test-2',
      repositoryId: 'repo-1',
      filePath: 'backend/api.py',
      functionName: 'parse_token',
      testContent: 'def test_parse_token(): pass',
      language: 'python',
      framework: 'pytest',
      executionStatus: 'failed',
      executionOutput: 'FAIL backend/test_api.py',
      createdAt: '2026-09-17T10:00:00Z',
      updatedAt: '2026-09-17T10:01:00Z',
    },
  ];

  describe('GeneratedTestsList', () => {
    it('renders list of generated tests with status badges and details', () => {
      const onSelect = vi.fn();
      const onRun = vi.fn();
      const onDelete = vi.fn();

      render(
        <GeneratedTestsList
          tests={sampleTests}
          loading={false}
          onSelectTest={onSelect}
          onRunTest={onRun}
          onDeleteTest={onDelete}
        />,
      );

      expect(screen.getByText('src/utils/math.ts')).toBeDefined();
      expect(screen.getByText('calculateTax()')).toBeDefined();
      expect(screen.getByText('Passed')).toBeDefined();
      expect(screen.getByText('backend/api.py')).toBeDefined();
      expect(screen.getByText('Failed')).toBeDefined();
    });

    it('triggers test execution when Run Sandbox button is clicked', () => {
      const onSelect = vi.fn();
      const onRun = vi.fn();
      const onDelete = vi.fn();

      render(
        <GeneratedTestsList
          tests={sampleTests}
          loading={false}
          onSelectTest={onSelect}
          onRunTest={onRun}
          onDeleteTest={onDelete}
        />,
      );

      const runButtons = screen.getAllByTitle('Run in Sandbox');
      expect(runButtons.length).toBe(2);

      fireEvent.click(runButtons[0]);
      expect(onRun).toHaveBeenCalledWith('test-1');
    });

    it('shows empty state placeholder when no tests are available', () => {
      render(
        <GeneratedTestsList
          tests={[]}
          loading={false}
          onSelectTest={vi.fn()}
          onRunTest={vi.fn()}
          onDeleteTest={vi.fn()}
        />,
      );

      expect(screen.getByText('No Generated Tests Yet')).toBeDefined();
    });
  });
});
