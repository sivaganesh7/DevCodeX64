/**
 * @DevCodeX64/config — Shared configuration constants and helpers
 */

export const QUEUE_NAMES = {
  REPOSITORY_INGESTION: 'repository:ingestion',
  REPOSITORY_CLONING:   'repository:cloning',
  CODE_ANALYSIS:        'analysis:code',
  SECURITY_ANALYSIS:    'analysis:security',
  DEPENDENCY_ANALYSIS:  'analysis:dependency',
  EMBEDDING:            'embedding:generate',
} as const

export const API_ENDPOINTS = {
  AUTH:          '/api/v1/auth',
  REPOSITORIES:  '/api/v1/repositories',
  ANALYSIS:      '/api/v1/analysis',
  SECURITY:      '/api/v1/security',
  ASSISTANT:     '/api/v1/assistant',
} as const
