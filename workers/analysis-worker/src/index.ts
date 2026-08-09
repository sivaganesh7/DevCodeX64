import { PrismaClient, RepositoryFile } from '@prisma/client';
import Queue from 'bull';
import * as dotenv from 'dotenv';
import path from 'path';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = typeof _traverse === 'function' ? _traverse : (_traverse as any).default;

// Load environment variables from the root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { DependencyScanner } from './dependency-analysis/dependency-scanner';
import { VulnerabilityScanner } from './security-analysis/vulnerability-scanner';
import { SecretScanner } from './security-analysis/secret-scanner';
import { CodeSecurityScanner } from './security-analysis/code-security-scanner';
import { RiskAnalyzer } from './security-analysis/risk-analyzer';
import { MLRiskProcessor } from './ml-risk/ml-risk-processor';

const prisma = new PrismaClient();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const analysisQueue = new Queue('analysis_queue', {
  redis: {
    host: redisHost,
    port: redisPort,
  },
});

interface AstResult {
  complexity: number;
  functions: string[];
  classes: string[];
  smells: { type: string; title: string; description: string; line: number; severity: string }[];
}

function analyzeAst(code: string, filePath: string): AstResult {
  let complexity = 0;
  const functions: string[] = [];
  const classes: string[] = [];
  const smells: AstResult['smells'] = [];

  try {
    const isTs = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const plugins: parser.ParserPlugin[] = [
      'jsx'
    ];
    if (isTs) plugins.push('typescript');

    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins,
    });

    traverse(ast, {
      // Cyclomatic Complexity factors
      IfStatement() { complexity++; },
      ForStatement() { complexity++; },
      ForInStatement() { complexity++; },
      ForOfStatement() { complexity++; },
      WhileStatement() { complexity++; },
      DoWhileStatement() { complexity++; },
      SwitchCase(nodePath: any) {
        if (nodePath.node.test) complexity++; // ignore default
      },
      ConditionalExpression() { complexity++; },
      LogicalExpression(nodePath: any) {
        const op = nodePath.node.operator;
        if (op === '&&' || op === '||' || op === '??') complexity++;
      },

      // Functions and Smells
      Function(nodePath: any) {
        let name = '<anonymous>';
        if (nodePath.node.type === 'FunctionDeclaration' && nodePath.node.id) {
          name = nodePath.node.id.name;
        } else if (
          nodePath.parent.type === 'VariableDeclarator' &&
          nodePath.parent.id.type === 'Identifier'
        ) {
          name = nodePath.parent.id.name;
        } else if (
          nodePath.parent.type === 'ClassMethod' &&
          nodePath.parent.key.type === 'Identifier'
        ) {
          name = nodePath.parent.key.name;
        }
        
        functions.push(name);

        const start = nodePath.node.loc?.start.line || 0;
        const end = nodePath.node.loc?.end.line || 0;
        const length = end - start;
        
        if (length > 30) {
          smells.push({
            type: 'COMPLEXITY',
            title: 'Long Method',
            description: `Function ${name} is ${length} lines long. Consider breaking it down.`,
            line: start,
            severity: length > 100 ? 'CRITICAL' : (length > 50 ? 'HIGH' : 'MEDIUM')
          });
        }
      },

      // Classes and Smells
      Class(nodePath: any) {
        let name = '<anonymous>';
        if (nodePath.node.type === 'ClassDeclaration' && nodePath.node.id) {
          name = nodePath.node.id.name;
        }
        classes.push(name);

        const start = nodePath.node.loc?.start.line || 0;
        const end = nodePath.node.loc?.end.line || 0;
        const length = end - start;
        
        if (length > 200) {
          smells.push({
            type: 'COMPLEXITY',
            title: 'Large Class',
            description: `Class ${name} is ${length} lines long. Consider splitting it.`,
            line: start,
            severity: length > 500 ? 'CRITICAL' : 'HIGH'
          });
        }
      }
    });

    // Base complexity for a file is 1
    complexity = Math.max(1, complexity);
  } catch (err) {
    // Parser error (syntax error, etc.) - ignore for metrics
  }

  return { complexity, functions, classes, smells };
}

analysisQueue.process('ANALYZE_REPOSITORY', async (job) => {
  const { jobId, repositoryId, owner, repo } = job.data;
  
  console.log(`[analysis-worker] Starting analysis job ${jobId} for ${owner}/${repo}`);

  try {
    // 1. Mark job as PROCESSING
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    // 2. Fetch all files for this repository
    const files = await prisma.repositoryFile.findMany({
      where: { repositoryId }
    });

    let totalLoc = 0;
    let totalComplexity = 0;
    let jsTsCount = 0;
    const languageCounts: Record<string, number> = {};

    for (const file of files) {
      if (!file.content) continue;

      const loc = file.content.split('\n').length;
      totalLoc += loc;

      const ext = file.extension?.toLowerCase() || '';
      languageCounts[ext] = (languageCounts[ext] || 0) + 1;

      // Create LOC metric
      await prisma.codeMetric.create({
        data: {
          analysisId: jobId,
          filePath: file.path,
          metricType: 'loc',
          value: loc,
        }
      });

      // Run deep AST analysis on JS/TS files
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        jsTsCount++;
        const astRes = analyzeAst(file.content, file.path);
        
        totalComplexity += astRes.complexity;

        await prisma.codeMetric.create({
          data: {
            analysisId: jobId,
            filePath: file.path,
            metricType: 'cyclomatic_complexity',
            value: astRes.complexity,
            details: {
              functions: astRes.functions,
              classes: astRes.classes,
            }
          }
        });

        // Insert issues (smells)
        for (const smell of astRes.smells) {
          await prisma.issue.create({
            data: {
              analysisId: jobId,
              type: smell.type,
              severity: smell.severity,
              title: smell.title,
              description: smell.description,
              filePath: file.path,
              lineNumber: smell.line,
            }
          });
        }
      }
    }

    // 3. Fake "jscpd" duplication for MVP (since real jscpd needs physical files or complex setup)
    // We'll skip real jscpd integration for this MVP phase to ensure stability, 
    // and rely on AST smells for quality issues.

    // 4. Calculate overall scores
    const avgComplexity = jsTsCount > 0 ? totalComplexity / jsTsCount : 1;
    
    let complexityScore = 100 - (avgComplexity * 2);
    if (complexityScore < 0) complexityScore = 0;

    let maintainabilityScore = 100 - (totalLoc / 1000); // just a dummy formula
    if (maintainabilityScore < 0) maintainabilityScore = 0;
    if (maintainabilityScore > 100) maintainabilityScore = 100;

    const healthScore = (complexityScore + maintainabilityScore) / 2;

    // 5. Save AnalysisResult
    await prisma.analysisResult.create({
      data: {
        analysisJobId: jobId,
        healthScore,
        maintainabilityScore,
        complexityScore,
        totalFiles: files.length,
        totalLines: totalLoc,
        languageBreakdown: languageCounts,
      }
    });

    // 5.5. Security & Dependency Analysis
    console.log(`[analysis-worker] Starting security scan for job ${jobId}`);
    
    // Create SecurityScan record
    const securityScan = await prisma.securityScan.create({
      data: {
        analysisJobId: jobId,
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    const simpleFiles = files.map(f => ({ path: f.path, content: f.content }));

    // Run Scanners
    const dependencies = DependencyScanner.scan(simpleFiles);
    const vulnerabilityScanner = new VulnerabilityScanner();
    const vulnerabilities = await vulnerabilityScanner.scan(dependencies);
    const secrets = SecretScanner.scan(simpleFiles);
    const codeSecurity = CodeSecurityScanner.scan(simpleFiles);

    // Save Dependencies and Vulnerabilities
    for (const dep of dependencies) {
      const dbDep = await prisma.dependency.create({
        data: {
          securityScanId: securityScan.id,
          name: dep.name,
          version: dep.version,
          ecosystem: dep.ecosystem,
          packageManager: dep.packageManager,
          isDirect: dep.isDirect
        }
      });

      const vulns = vulnerabilities.get(dep.name) || [];
      for (const vuln of vulns) {
        await prisma.vulnerability.create({
          data: {
            dependencyId: dbDep.id,
            identifier: vuln.identifier,
            severity: vuln.severity,
            affectedRange: vuln.affectedRange,
            description: vuln.description,
            recommendation: vuln.recommendation,
            referenceUrls: vuln.referenceUrls
          }
        });
      }
    }

    // Save Secrets
    for (const secret of secrets) {
      await prisma.secretFinding.create({
        data: {
          securityScanId: securityScan.id,
          secretType: secret.secretType,
          redactedValue: secret.redactedValue,
          filePath: secret.filePath,
          lineNumber: secret.lineNumber
        }
      });
    }

    // Save Code Security Findings
    for (const cs of codeSecurity) {
      await prisma.securityFinding.create({
        data: {
          securityScanId: securityScan.id,
          type: cs.type,
          severity: cs.severity,
          title: cs.title,
          description: cs.description,
          filePath: cs.filePath,
          lineNumber: cs.lineNumber
        }
      });
    }

    // Calculate Risk Score
    const allVulns = Array.from(vulnerabilities.values()).flat();
    const riskScore = RiskAnalyzer.analyze(allVulns, secrets, codeSecurity);

    // Complete SecurityScan
    await prisma.securityScan.update({
      where: { id: securityScan.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        riskScore
      }
    });

    // 5.6. ML Risk Prediction Phase 7
    await MLRiskProcessor.process(jobId, repositoryId, files);

    // 6. Mark job as COMPLETED
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    console.log(`[analysis-worker] Analysis job ${jobId} completed.`);
  } catch (error: any) {
    console.error(`[analysis-worker] Analysis job ${jobId} failed:`, error);
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: error.message || 'Unknown error occurred',
        completedAt: new Date(),
      },
    });
  }
});

analysisQueue.on('error', (error) => {
  console.error('[analysis-worker] Queue error:', error);
});

console.log(`[analysis-worker] Bull worker initialized. Listening for jobs on 'analysis_queue'...`);
