import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import configuration from './config/configuration'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './modules/health/health.module'

/**
 * AppModule — Root NestJS module for DevCodeX64 API.
 *
 * Phase 1: Only DatabaseModule and HealthModule are active.
 * Remaining feature modules are added in their respective phases:
 *   Phase 2:  AuthModule, UsersModule
 *   Phase 3:  GithubModule, WebhooksModule
 *   Phase 4:  RepositoriesModule, JobsModule
 *   Phase 5:  AnalysisModule, IssuesModule
 *   Phase 6:  SecurityModule, DependenciesModule
 *   Phase 7:  RiskModule
 *   Phase 8:  AssistantModule
 *   Phase 9:  CodeReviewModule
 *   Phase 10: (Agent tools wired into AssistantModule)
 *   Phase 11: TestGenerationModule
 *   Phase 12: DocumentationModule
 *   Phase 13: PullRequestsModule
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
    // Feature modules registered in subsequent phases — DO NOT add prematurely
  ],
})
export class AppModule {}
