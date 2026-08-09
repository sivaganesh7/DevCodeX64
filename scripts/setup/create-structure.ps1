# DevCodeX64 - Monorepo Structure Scaffold Script
# Run from the DevCodeX64 root directory

$root = $PSScriptRoot | Split-Path | Split-Path

Write-Host "Scaffolding DevCodeX64 monorepo structure..." -ForegroundColor Cyan
Write-Host "Root: $root" -ForegroundColor Gray

function New-Dir($path) {
    $full = Join-Path $root $path
    if (-not (Test-Path $full)) {
        New-Item -ItemType Directory -Path $full -Force | Out-Null
    }
}

function New-File($path, $content = "") {
    $full = Join-Path $root $path
    if (-not (Test-Path $full)) {
        New-Item -ItemType File -Path $full -Force | Out-Null
        if ($content) { Set-Content -Path $full -Value $content }
    }
}

# === apps/web ===
New-Dir "apps/web/public"
New-Dir "apps/web/src/app"
New-Dir "apps/web/src/components/ui"
New-Dir "apps/web/src/components/layout"
New-Dir "apps/web/src/components/charts"
New-Dir "apps/web/src/components/code-editor"
New-Dir "apps/web/src/components/common"
New-Dir "apps/web/src/features/auth"
New-Dir "apps/web/src/features/dashboard"
New-Dir "apps/web/src/features/repositories"
New-Dir "apps/web/src/features/analysis"
New-Dir "apps/web/src/features/security"
New-Dir "apps/web/src/features/dependencies"
New-Dir "apps/web/src/features/risk"
New-Dir "apps/web/src/features/issues"
New-Dir "apps/web/src/features/assistant"
New-Dir "apps/web/src/features/code-review"
New-Dir "apps/web/src/features/test-generation"
New-Dir "apps/web/src/features/documentation"
New-Dir "apps/web/src/features/pull-requests"
New-Dir "apps/web/src/hooks"
New-Dir "apps/web/src/services"
New-Dir "apps/web/src/lib"
New-Dir "apps/web/src/types"
New-Dir "apps/web/src/utils"
New-Dir "apps/web/src/assets"
New-Dir "apps/web/src/styles"

# === apps/api ===
New-Dir "apps/api/src/config"
New-Dir "apps/api/src/common/guards"
New-Dir "apps/api/src/common/interceptors"
New-Dir "apps/api/src/common/filters"
New-Dir "apps/api/src/common/decorators"
New-Dir "apps/api/src/common/pipes"
New-Dir "apps/api/src/common/middleware"
New-Dir "apps/api/src/modules/auth"
New-Dir "apps/api/src/modules/users"
New-Dir "apps/api/src/modules/github"
New-Dir "apps/api/src/modules/repositories"
New-Dir "apps/api/src/modules/analysis"
New-Dir "apps/api/src/modules/security"
New-Dir "apps/api/src/modules/dependencies"
New-Dir "apps/api/src/modules/risk"
New-Dir "apps/api/src/modules/issues"
New-Dir "apps/api/src/modules/assistant"
New-Dir "apps/api/src/modules/code-review"
New-Dir "apps/api/src/modules/test-generation"
New-Dir "apps/api/src/modules/documentation"
New-Dir "apps/api/src/modules/pull-requests"
New-Dir "apps/api/src/modules/webhooks"
New-Dir "apps/api/src/modules/jobs"
New-Dir "apps/api/src/modules/health"
New-Dir "apps/api/src/database"
New-Dir "apps/api/test"

# === apps/ai-service ===
New-Dir "apps/ai-service/app/config"
New-Dir "apps/ai-service/app/api/routes"
New-Dir "apps/ai-service/app/api/schemas"
New-Dir "apps/ai-service/app/core/llm"
New-Dir "apps/ai-service/app/core/embeddings"
New-Dir "apps/ai-service/app/core/rag"
New-Dir "apps/ai-service/app/core/agents"
New-Dir "apps/ai-service/app/core/security"
New-Dir "apps/ai-service/app/ml/features"
New-Dir "apps/ai-service/app/ml/models"
New-Dir "apps/ai-service/app/ml/training"
New-Dir "apps/ai-service/app/ml/prediction"
New-Dir "apps/ai-service/app/ml/evaluation"
New-Dir "apps/ai-service/app/analyzers/code"
New-Dir "apps/ai-service/app/analyzers/security"
New-Dir "apps/ai-service/app/analyzers/dependencies"
New-Dir "apps/ai-service/app/analyzers/complexity"
New-Dir "apps/ai-service/app/services"
New-Dir "apps/ai-service/app/repositories"
New-Dir "apps/ai-service/app/schemas"
New-Dir "apps/ai-service/app/utils"
New-Dir "apps/ai-service/tests"
New-Dir "apps/ai-service/models"

# === workers ===
New-Dir "workers/repository-worker/src/ingestion"
New-Dir "workers/repository-worker/src/cloning"
New-Dir "workers/repository-worker/src/processing"
New-Dir "workers/analysis-worker/src/code-analysis"
New-Dir "workers/analysis-worker/src/security-analysis"
New-Dir "workers/analysis-worker/src/dependency-analysis"
New-Dir "workers/analysis-worker/src/metrics"
New-Dir "workers/embedding-worker/src/chunking"
New-Dir "workers/embedding-worker/src/embeddings"
New-Dir "workers/embedding-worker/src/vector-storage"

# === packages ===
New-Dir "packages/types/src"
New-Dir "packages/config/src"
New-Dir "packages/validation/src"
New-Dir "packages/shared/src"

# === database ===
New-Dir "database/prisma/migrations"

# === tests ===
New-Dir "tests/e2e"
New-Dir "tests/integration"
New-Dir "tests/security"
New-Dir "tests/fixtures"

# === infrastructure ===
New-Dir "infrastructure/docker"
New-Dir "infrastructure/github/workflows"
New-Dir "infrastructure/nginx"
New-Dir "infrastructure/deployment"

# === scripts ===
New-Dir "scripts/setup"
New-Dir "scripts/database"
New-Dir "scripts/development"
New-Dir "scripts/deployment"

# === docs ===
New-Dir "docs"

# === .agents ===
New-Dir ".agents/rules"

# === .github ===
New-Dir ".github/ISSUE_TEMPLATE"

Write-Host "Directory structure created!" -ForegroundColor Green
