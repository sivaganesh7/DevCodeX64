import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentationHistoryList } from './components/DocumentationHistoryList';
import { DocumentationArtifact } from './services/documentationApi';

describe('Documentation Components', () => {
  const sampleDocs: DocumentationArtifact[] = [
    {
      id: 'doc-1',
      repositoryId: 'repo-1',
      docType: 'README',
      title: 'Repository Developer Guide',
      content: '# Developer Guide\nThis repository provides automated testing.',
      filePath: null,
      createdAt: '2026-09-17T12:00:00Z',
      updatedAt: '2026-09-17T12:00:00Z',
    },
    {
      id: 'doc-2',
      repositoryId: 'repo-1',
      docType: 'API',
      title: 'REST API Reference',
      content: '# REST API\n| Method | Path |\n|---|---|\n| GET | /health |',
      filePath: 'src/api/routes.ts',
      createdAt: '2026-09-17T11:00:00Z',
      updatedAt: '2026-09-17T11:00:00Z',
    },
    {
      id: 'doc-3',
      repositoryId: 'repo-1',
      docType: 'ARCHITECTURE',
      title: 'System Architecture',
      content: '# Architecture Overview\n```mermaid\ngraph TD\nA-->B\n```',
      filePath: null,
      createdAt: '2026-09-17T10:00:00Z',
      updatedAt: '2026-09-17T10:00:00Z',
    },
  ];

  describe('DocumentationHistoryList', () => {
    it('renders list of documentation items with type badges and titles', () => {
      const onSelect = vi.fn();
      const onDelete = vi.fn();

      render(
        <DocumentationHistoryList
          documents={sampleDocs}
          loading={false}
          onSelectDoc={onSelect}
          onDeleteDoc={onDelete}
        />,
      );

      expect(screen.getByText('Repository Developer Guide')).toBeDefined();
      expect(screen.getByText('REST API Reference')).toBeDefined();
      expect(screen.getByText('System Architecture')).toBeDefined();
      expect(screen.getByText('README')).toBeDefined();
      expect(screen.getByText('API')).toBeDefined();
      expect(screen.getByText('ARCHITECTURE')).toBeDefined();
    });

    it('triggers document selection on card click', () => {
      const onSelect = vi.fn();
      const onDelete = vi.fn();

      render(
        <DocumentationHistoryList
          documents={sampleDocs}
          loading={false}
          onSelectDoc={onSelect}
          onDeleteDoc={onDelete}
        />,
      );

      fireEvent.click(screen.getByText('Repository Developer Guide'));
      expect(onSelect).toHaveBeenCalledWith(sampleDocs[0]);
    });

    it('triggers delete callback when delete button is clicked', () => {
      const onSelect = vi.fn();
      const onDelete = vi.fn();

      render(
        <DocumentationHistoryList
          documents={sampleDocs}
          loading={false}
          onSelectDoc={onSelect}
          onDeleteDoc={onDelete}
        />,
      );

      const deleteButtons = screen.getAllByTitle('Delete Document');
      expect(deleteButtons.length).toBe(3);

      fireEvent.click(deleteButtons[0]);
      expect(onDelete).toHaveBeenCalledWith('doc-1');
    });

    it('renders empty state placeholder when no documents exist', () => {
      render(
        <DocumentationHistoryList
          documents={[]}
          loading={false}
          onSelectDoc={vi.fn()}
          onDeleteDoc={vi.fn()}
        />,
      );

      expect(screen.getByText('No Documentation Generated Yet')).toBeDefined();
    });
  });
});
