export interface CodeSecurityResult {
  type: string;
  severity: string;
  title: string;
  description: string;
  filePath: string;
  lineNumber: number;
}

export class CodeSecurityScanner {
  // Simple regex patterns for deterministic matching
  private static readonly PATTERNS = [
    {
      regex: /eval\s*\(/g,
      type: 'UNSAFE_EVAL',
      severity: 'HIGH',
      title: 'Unsafe Eval Usage',
      description: 'The use of eval() can lead to arbitrary code execution.'
    },
    {
      regex: /exec\s*\(/g,
      type: 'COMMAND_INJECTION',
      severity: 'HIGH',
      title: 'Command Execution',
      description: 'Using exec() can lead to OS command injection if input is not sanitized.'
    },
    {
      regex: /\+\s*(req\.(query|body|params)\.[a-zA-Z0-9_]+)/g, // crude SQLi detection attempt e.g. "SELECT * FROM x WHERE id = " + req.query.id
      type: 'SQL_INJECTION',
      severity: 'CRITICAL',
      title: 'Potential SQL Injection',
      description: 'String concatenation with request variables might lead to SQL Injection.'
    },
    {
      regex: /fs\.readFile(Sync)?\s*\(\s*[^,]*\+\s*req\./g,
      type: 'PATH_TRAVERSAL',
      severity: 'HIGH',
      title: 'Path Traversal Risk',
      description: 'Reading files using request parameters directly can lead to path traversal.'
    }
  ];

  public static scan(files: { path: string; content: string | null }[]): CodeSecurityResult[] {
    const findings: CodeSecurityResult[] = [];

    for (const file of files) {
      if (!file.content) continue;
      
      const lines = file.content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const pattern of this.PATTERNS) {
          if (pattern.regex.test(line)) {
            findings.push({
              type: pattern.type,
              severity: pattern.severity,
              title: pattern.title,
              description: pattern.description,
              filePath: file.path,
              lineNumber: i + 1
            });
            // Reset regex state just in case it has global flag
            pattern.regex.lastIndex = 0;
          }
        }
      }
    }

    return findings;
  }
}
