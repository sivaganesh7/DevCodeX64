import { PrismaClient, RepositoryFile } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export class MLRiskProcessor {
  static async process(analysisId: string, repositoryId: string, files: RepositoryFile[]) {
    console.log(`[ml-risk-processor] Starting ML Risk Prediction for analysis ${analysisId}`);
    try {
      // Fetch metrics and issues
      const metrics = await prisma.codeMetric.findMany({ where: { analysisId } });
      const issues = await prisma.issue.findMany({ where: { analysisId } });
      
      // Fetch security findings
      const securityScan = await prisma.securityScan.findUnique({
        where: { analysisJobId: analysisId },
        include: { securityFindings: true }
      });
      const securityFindings = securityScan?.securityFindings || [];

      const predictionsToSave: any[] = [];
      const factorsToSave: any[] = [];

      // Process each file
      for (const file of files) {
        // Skip files that are likely irrelevant or empty
        if (!file.content) continue;

        // Group data by this file
        const fileMetrics = metrics.filter(m => m.filePath === file.path);
        const fileIssues = issues.filter(i => i.filePath === file.path);
        const fileSecFindings = securityFindings.filter(s => s.filePath === file.path);

        const loc = fileMetrics.find(m => m.metricType === 'loc')?.value || 0;
        const complexity = fileMetrics.find(m => m.metricType === 'cyclomatic_complexity')?.value || 0;
        const functions = (fileMetrics.find(m => m.metricType === 'cyclomatic_complexity')?.details as any)?.functions?.length || 0;
        const codeSmells = fileIssues.length;
        const sfCount = fileSecFindings.length;
        const highFindingsCount = fileSecFindings.filter(s => s.severity === 'HIGH' || s.severity === 'CRITICAL').length;
        
        // For phase 7, dependencies are repo-wide but we might not map them per file reliably, use 0 or some logic
        const dependenciesCount = 0; 

        const features = {
          loc,
          complexity,
          functions,
          dependencies: dependenciesCount,
          codeSmells,
          securityFindings: sfCount,
          highFindings: highFindingsCount,
        };

        try {
          const response = await axios.post(`${AI_SERVICE_URL}/predict-risk`, {
            features
          });

          const { riskProbability, riskLevel, factors, modelVersion } = response.data;

          const prediction = await prisma.mLRiskPrediction.create({
            data: {
              analysisId,
              fileId: file.id,
              riskProbability,
              riskLevel,
              modelVersion
            }
          });

          for (const factor of factors) {
            await prisma.mLRiskFactor.create({
              data: {
                predictionId: prediction.id,
                feature: factor.feature,
                impact: factor.impact,
                value: features[factor.feature as keyof typeof features] || 0
              }
            });
          }
        } catch (error: any) {
          console.error(`[ml-risk-processor] ML API call failed for file ${file.path}: ${error.message}`);
        }
      }

      console.log(`[ml-risk-processor] ML Risk Prediction finished for analysis ${analysisId}`);
    } catch (error) {
      console.error(`[ml-risk-processor] Failed to process ML Risk for analysis ${analysisId}:`, error);
    }
  }
}
