import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
import * as crypto from 'crypto';

const traverse = typeof _traverse === 'function' ? _traverse : (_traverse as any).default;

export interface CodeChunkData {
  filePath: string;
  startLine: number;
  endLine: number;
  chunkType: 'FUNCTION' | 'CLASS' | 'SECTION' | 'DOCUMENTATION';
  symbol?: string;
  content: string;
  contentHash: string;
  language: string;
}

export class ASTChunker {
  public static hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  public static chunkFile(filePath: string, content: string): CodeChunkData[] {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const isJsTs = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext);

    if (isJsTs) {
      try {
        const astChunks = this.chunkJsTs(filePath, content, ext);
        if (astChunks.length > 0) {
          return astChunks;
        }
      } catch {
        // Fallback to sliding window if AST parsing encounters syntax error
      }
    }

    return this.chunkSlidingWindow(filePath, content, ext);
  }

  private static chunkJsTs(filePath: string, content: string, ext: string): CodeChunkData[] {
    const isTs = ext === 'ts' || ext === 'tsx';
    const plugins: parser.ParserPlugin[] = ['jsx'];
    if (isTs) plugins.push('typescript');

    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins,
      errorRecovery: true,
    });

    const lines = content.split('\n');
    const chunks: CodeChunkData[] = [];
    const visitedRanges = new Set<string>();

    traverse(ast, {
      FunctionDeclaration(path: any) {
        const node = path.node;
        if (node.loc) {
          const start = node.loc.start.line;
          const end = node.loc.end.line;
          const rangeKey = `${start}-${end}`;
          if (!visitedRanges.has(rangeKey)) {
            visitedRanges.add(rangeKey);
            const chunkLines = lines.slice(start - 1, end).join('\n');
            const symbol = node.id?.name || 'anonymousFunction';
            chunks.push({
              filePath,
              startLine: start,
              endLine: end,
              chunkType: 'FUNCTION',
              symbol,
              content: chunkLines,
              contentHash: ASTChunker.hashContent(chunkLines),
              language: ext,
            });
          }
        }
      },
      ClassDeclaration(path: any) {
        const node = path.node;
        if (node.loc) {
          const start = node.loc.start.line;
          const end = node.loc.end.line;
          const rangeKey = `${start}-${end}`;
          if (!visitedRanges.has(rangeKey)) {
            visitedRanges.add(rangeKey);
            const chunkLines = lines.slice(start - 1, end).join('\n');
            const symbol = node.id?.name || 'anonymousClass';
            chunks.push({
              filePath,
              startLine: start,
              endLine: end,
              chunkType: 'CLASS',
              symbol,
              content: chunkLines,
              contentHash: ASTChunker.hashContent(chunkLines),
              language: ext,
            });
          }
        }
      },
      ClassMethod(path: any) {
        const node = path.node;
        if (node.loc) {
          const start = node.loc.start.line;
          const end = node.loc.end.line;
          const rangeKey = `${start}-${end}`;
          if (!visitedRanges.has(rangeKey) && (end - start) >= 2) {
            visitedRanges.add(rangeKey);
            const chunkLines = lines.slice(start - 1, end).join('\n');
            const symbol = node.key?.name || 'method';
            chunks.push({
              filePath,
              startLine: start,
              endLine: end,
              chunkType: 'FUNCTION',
              symbol,
              content: chunkLines,
              contentHash: ASTChunker.hashContent(chunkLines),
              language: ext,
            });
          }
        }
      },
      VariableDeclaration(path: any) {
        const node = path.node;
        for (const decl of node.declarations) {
          if (
            decl.init &&
            (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression') &&
            decl.loc
          ) {
            const start = decl.loc.start.line;
            const end = decl.loc.end.line;
            const rangeKey = `${start}-${end}`;
            if (!visitedRanges.has(rangeKey)) {
              visitedRanges.add(rangeKey);
              const chunkLines = lines.slice(start - 1, end).join('\n');
              const symbol = decl.id?.name || 'arrowFunction';
              chunks.push({
                filePath,
                startLine: start,
                endLine: end,
                chunkType: 'FUNCTION',
                symbol,
                content: chunkLines,
                contentHash: ASTChunker.hashContent(chunkLines),
                language: ext,
              });
            }
          }
        }
      },
    });

    if (chunks.length === 0) {
      return this.chunkSlidingWindow(filePath, content, ext);
    }

    return chunks;
  }

  private static chunkSlidingWindow(
    filePath: string,
    content: string,
    ext: string,
    windowSizeLines: number = 40,
    overlapLines: number = 10,
  ): CodeChunkData[] {
    const lines = content.split('\n');
    const chunks: CodeChunkData[] = [];
    const isDoc = ['md', 'txt', 'rst', 'doc'].includes(ext);

    if (lines.length <= windowSizeLines) {
      const text = lines.join('\n');
      return [
        {
          filePath,
          startLine: 1,
          endLine: lines.length,
          chunkType: isDoc ? 'DOCUMENTATION' : 'SECTION',
          content: text,
          contentHash: ASTChunker.hashContent(text),
          language: ext,
        },
      ];
    }

    let start = 0;
    while (start < lines.length) {
      const end = Math.min(start + windowSizeLines, lines.length);
      const chunkLines = lines.slice(start, end).join('\n');
      chunks.push({
        filePath,
        startLine: start + 1,
        endLine: end,
        chunkType: isDoc ? 'DOCUMENTATION' : 'SECTION',
        content: chunkLines,
        contentHash: ASTChunker.hashContent(chunkLines),
        language: ext,
      });

      if (end >= lines.length) break;
      start += windowSizeLines - overlapLines;
    }

    return chunks;
  }
}
