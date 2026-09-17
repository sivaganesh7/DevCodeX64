import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentTraceViewer } from './components/AgentTraceViewer';
import { AgentStep } from './services/assistantApi';

describe('AI Engineering Agent Frontend Components', () => {
  const sampleSteps: AgentStep[] = [
    {
      iteration: 1,
      thought: 'Inspect repository security findings for exposed credentials.',
      action: 'get_security_findings',
      actionInput: { severity: 'CRITICAL' },
      observation: '1 CRITICAL vulnerability found in src/auth/jwt.ts',
    },
    {
      iteration: 2,
      thought: 'Examine source code around line 15 to locate secret key.',
      action: 'read_file',
      actionInput: { filePath: 'src/auth/jwt.ts', startLine: 1, endLine: 25 },
      observation: '15: const secret = "hardcoded-token-12345";',
    },
    {
      iteration: 3,
      thought: 'Synthesizing test coverage to verify token rejection.',
      action: 'generate_tests',
      actionInput: { filePath: 'src/auth/jwt.ts', functionName: 'verifyToken' },
      observation: 'Generated test suite for verifyToken.',
    },
  ];

  describe('AgentTraceViewer', () => {
    it('renders trace header with step count and tools', () => {
      render(
        <AgentTraceViewer
          steps={sampleSteps}
          toolsUsed={['get_security_findings', 'read_file', 'generate_tests']}
          iterationsUsed={3}
        />,
      );

      expect(screen.getByText('Autonomous ReAct Execution Trace')).toBeDefined();
      expect(screen.getByText('3 steps')).toBeDefined();
      expect(screen.getByText('Tools: get_security_findings, read_file, generate_tests')).toBeDefined();
    });

    it('expands trace and reveals thoughts and actions upon clicking', () => {
      render(
        <AgentTraceViewer
          steps={sampleSteps}
          toolsUsed={['get_security_findings', 'read_file', 'generate_tests']}
          iterationsUsed={3}
        />,
      );

      // Expand main drawer
      const headerBtn = screen.getByRole('button');
      fireEvent.click(headerBtn);

      // Verify thoughts and actions are rendered
      expect(screen.getAllByText('get_security_findings').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('read_file').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('generate_tests').length).toBeGreaterThanOrEqual(1);
    });
  });
});
