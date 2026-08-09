export default () => ({
  port:        parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv:     process.env.NODE_ENV ?? 'development',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  jwt: {
    secret:    process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  },
  github: {
    clientId:     process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl:  process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:3001/api/auth/github/callback',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  },
  aiService: {
    url: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  },
})
