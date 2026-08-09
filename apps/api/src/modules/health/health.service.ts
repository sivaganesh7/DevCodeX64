import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

export interface HealthStatus {
  status:    'ok' | 'degraded'
  database:  string
  version:   string
  timestamp: string
}

/**
 * HealthService — Phase 1
 *
 * Checks PostgreSQL connectivity via Prisma.
 * Redis connectivity check is added in Phase 4 when workers are introduced.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name)

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const dbStatus = await this.checkDatabase()

    return {
      status:    dbStatus === 'connected' ? 'ok' : 'degraded',
      database:  dbStatus,
      version:   process.env.npm_package_version ?? '1.0.0',
      timestamp: new Date().toISOString(),
    }
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return 'connected'
    } catch (err) {
      this.logger.error('Database health check failed', err)
      return 'disconnected'
    }
  }
}
