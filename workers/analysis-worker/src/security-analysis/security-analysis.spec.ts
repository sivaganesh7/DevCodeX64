import { SecretScanner } from './secret-scanner';
import { DependencyScanner } from '../dependency-analysis/dependency-scanner';
import { RiskAnalyzer } from './risk-analyzer';
import { CodeSecurityScanner } from './code-security-scanner';

describe('Security Analysis', () => {
  it('should redact secrets correctly', () => {
    const files = [{
      path: 'src/config.ts',
      content: 'const token = "ghp_123456789012345678901234567890123456";'
    }];
    const secrets = SecretScanner.scan(files);
    
    expect(secrets.length).toBe(1);
    expect(secrets[0].secretType).toBe('GITHUB_TOKEN');
    expect(secrets[0].redactedValue).toContain('****************');
    expect(secrets[0].redactedValue).not.toContain('123456789012345678901234567890123456');
  });

  it('should detect dependencies from package.json', () => {
    const files = [{
      path: 'package.json',
      content: JSON.stringify({
        dependencies: {
          'lodash': '4.17.15',
          'express': '3.0.0'
        }
      })
    }];
    const deps = DependencyScanner.scan(files);
    
    expect(deps.length).toBe(2);
    expect(deps.find(d => d.name === 'lodash')?.version).toBe('4.17.15');
  });

  it('should detect code security issues', () => {
    const files = [{
      path: 'src/app.js',
      content: 'eval("console.log(1)");\nconst cmd = exec("rm -rf /");'
    }];
    const findings = CodeSecurityScanner.scan(files);
    
    expect(findings.length).toBe(2);
    expect(findings.some(f => f.type === 'UNSAFE_EVAL')).toBe(true);
    expect(findings.some(f => f.type === 'COMMAND_INJECTION')).toBe(true);
  });

  it('should calculate risk score', () => {
    const score = RiskAnalyzer.analyze(
      [{ identifier: 'CVE', severity: 'CRITICAL', referenceUrls: [] }],
      [],
      []
    );
    expect(score).toBe(10);
  });
});
