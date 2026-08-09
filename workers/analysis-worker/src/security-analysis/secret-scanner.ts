export interface SecretFindingResult {
  secretType: string;
  redactedValue: string;
  filePath: string;
  lineNumber: number;
}

export class SecretScanner {
  // Common patterns for secrets
  private static readonly PATTERNS = [
    { type: 'GITHUB_TOKEN', regex: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}/g },
    { type: 'AWS_ACCESS_KEY', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
    { type: 'STRIPE_SECRET_KEY', regex: /sk_(?:live|test)_[0-9a-zA-Z]{24}/g },
    { type: 'JWT_TOKEN', regex: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*?/g }
  ];

  public static scan(files: { path: string; content: string | null }[]): SecretFindingResult[] {
    const findings: SecretFindingResult[] = [];

    for (const file of files) {
      if (!file.content) continue;
      
      const lines = file.content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const pattern of this.PATTERNS) {
          const matches = line.matchAll(pattern.regex);
          for (const match of matches) {
            const secretValue = match[0];
            findings.push({
              secretType: pattern.type,
              redactedValue: this.redact(secretValue),
              filePath: file.path,
              lineNumber: i + 1
            });
          }
        }
      }
    }

    return findings;
  }

  private static redact(secret: string): string {
    if (secret.length <= 6) return '******';
    const prefixLen = Math.floor(secret.length * 0.15) || 1;
    const suffixLen = Math.floor(secret.length * 0.15) || 1;
    const prefix = secret.substring(0, prefixLen);
    const suffix = secret.substring(secret.length - suffixLen);
    return `${prefix}****************${suffix}`;
  }
}
