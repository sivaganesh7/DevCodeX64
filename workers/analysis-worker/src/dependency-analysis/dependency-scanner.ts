export interface DependencyResult {
  name: string;
  version: string;
  ecosystem: string;
  packageManager: string;
  isDirect: boolean;
}

export class DependencyScanner {
  public static scan(files: { path: string; content: string | null }[]): DependencyResult[] {
    const dependencies: DependencyResult[] = [];

    for (const file of files) {
      if (!file.content) continue;

      if (file.path.endsWith('package.json') && !file.path.includes('node_modules')) {
        try {
          const pkg = JSON.parse(file.content);
          
          if (pkg.dependencies) {
            for (const [name, version] of Object.entries(pkg.dependencies)) {
              dependencies.push({
                name,
                version: version as string,
                ecosystem: 'npm',
                packageManager: 'npm/yarn/pnpm',
                isDirect: true
              });
            }
          }
          if (pkg.devDependencies) {
            for (const [name, version] of Object.entries(pkg.devDependencies)) {
              dependencies.push({
                name,
                version: version as string,
                ecosystem: 'npm',
                packageManager: 'npm/yarn/pnpm',
                isDirect: true
              });
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      if (file.path.endsWith('requirements.txt')) {
        const lines = file.content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const parts = trimmed.split(/==|>=|<=|~=|>|</);
            if (parts.length > 0) {
              const name = parts[0].trim();
              const version = parts.length > 1 ? parts[1].trim() : 'latest';
              if (name) {
                dependencies.push({
                  name,
                  version,
                  ecosystem: 'pypi',
                  packageManager: 'pip',
                  isDirect: true
                });
              }
            }
          }
        }
      }
    }

    // Deduplicate by name and ecosystem
    const unique = new Map<string, DependencyResult>();
    for (const dep of dependencies) {
      const key = `${dep.ecosystem}:${dep.name}`;
      if (!unique.has(key)) {
        unique.set(key, dep);
      }
    }

    return Array.from(unique.values());
  }
}
