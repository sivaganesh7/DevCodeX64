import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import configuration from './config/configuration'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './modules/health/health.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { GitHubModule } from './modules/github/github.module'
import { IngestionModule } from './modules/ingestion/ingestion.module'
import { AnalysisModule } from './modules/analysis/analysis.module'
import { SecurityModule } from './modules/security/security.module'
import { RiskModule } from './modules/risk/risk.module'
import { AssistantModule } from './modules/assistant/assistant.module'
import { CodeReviewModule } from './modules/code-review/code-review.module'
import { BullModule } from '@nestjs/bull'

/**
 * AppModule — Root NestJS module for DevCodeX64 API.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:   true,
      load:       [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 300 },  // 300 req/min default — tightened per-endpoint in Phase 2+
    ]),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    GitHubModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    IngestionModule,
    AnalysisModule,
    SecurityModule,
    RiskModule,
    AssistantModule,
    CodeReviewModule,
    // Feature modules registered in subsequent phases — DO NOT add prematurely
  ],
})
export class AppModule {}
