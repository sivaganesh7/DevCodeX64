import { VulnerabilityResult } from './vulnerability-scanner';
import { SecretFindingResult } from './secret-scanner';
import { CodeSecurityResult } from './code-security-scanner';

export class RiskAnalyzer {
  private static readonly WEIGHTS: Record<string, number> = {
    'CRITICAL': 10,
    'HIGH': 7,
    'MEDIUM': 4,
    'LOW': 1,
    'INFO': 0
  };

  public static analyze(
    vulnerabilities: VulnerabilityResult[],
    secrets: SecretFindingResult[],
    codeSecurity: CodeSecurityResult[]
  ): number {
    let totalRisk = 0;

    // Vulnerabilities
    for (const v of vulnerabilities) {
      totalRisk += this.WEIGHTS[v.severity?.toUpperCase()] || 1;
    }

    // Secrets (always critical)
    for (const s of secrets) {
      totalRisk += this.WEIGHTS['CRITICAL'];
    }

    // Code Security
    for (const cs of codeSecurity) {
      totalRisk += this.WEIGHTS[cs.severity?.toUpperCase()] || 1;
    }

    // A completely secure repo has 0 points = 100 risk score (perfect)
    // Actually, "Risk Score" usually means higher = more risk.
    // If the prompt says "Risk scoring... Normalize the final score into a 0-100 range",
    // DevCodeX64 health scores are usually 0-100 where 100 is best, or risk score 100 is worst?
    // Let's make 100 the maximum risk (worst).
    
    // Normalize logic: max risk score we cap at 100.
    // 1 Critical finding is already 10. So 10 Criticals = 100 risk score.
    const normalizedRisk = Math.min(100, Math.max(0, totalRisk));
    
    return normalizedRisk;
  }
}
