-- CreateTable
CREATE TABLE "repositories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "github_integration_id" UUID,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "github_repository_id" TEXT NOT NULL,
    "default_branch" TEXT NOT NULL DEFAULT 'main',
    "description" TEXT,
    "language" TEXT,
    "visibility" TEXT,
    "html_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_files" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "extension" TEXT,
    "language" TEXT,
    "size" INTEGER NOT NULL,
    "sha" TEXT NOT NULL,
    "file_type" TEXT NOT NULL DEFAULT 'SOURCE',
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_jobs" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "branch" TEXT NOT NULL DEFAULT 'main',
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "processed_files" INTEGER NOT NULL DEFAULT 0,
    "skipped_files" INTEGER NOT NULL DEFAULT 0,
    "failed_files" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingestion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repository_files_repository_id_path_key" ON "repository_files"("repository_id", "path");

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_github_integration_id_fkey" FOREIGN KEY ("github_integration_id") REFERENCES "github_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_files" ADD CONSTRAINT "repository_files_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
