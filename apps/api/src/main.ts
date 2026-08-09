import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  })

  const configService = app.get(ConfigService)
  const port        = configService.get<number>('port', 3001)
  const frontendUrl = configService.get<string>('frontendUrl', 'http://localhost:5173')
  const nodeEnv     = configService.get<string>('nodeEnv', 'development')

  // ── Security headers (Helmet)
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production',
  }))

  // ── CORS — allow frontend origin only
  app.enableCors({
    origin:      [frontendUrl],
    credentials: true,
    methods:     ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // ── Global API prefix
  app.setGlobalPrefix('api')

  // ── Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist:            true,
    forbidNonWhitelisted: true,
    transform:            true,
    transformOptions:     { enableImplicitConversion: true },
  }))

  // ── Swagger docs (development only)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('DevCodeX64 API')
      .setDescription('Code Intelligence & DevSecOps Platform — REST API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
    Logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap')
  }

  await app.listen(port)
  Logger.log(`DevCodeX64 API running on: http://localhost:${port}/api`, 'Bootstrap')
  Logger.log(`Environment: ${nodeEnv}`, 'Bootstrap')
}

bootstrap()
