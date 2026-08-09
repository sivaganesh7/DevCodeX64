-- CreateTable
CREATE TABLE "analysis_jobs" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" UUID NOT NULL,
    "analysis_job_id" UUID NOT NULL,
    "health_score" DOUBLE PRECISION,
    "maintainability_score" DOUBLE PRECISION,
    "complexity_score" DOUBLE PRECISION,
    "total_files" INTEGER,
    "total_lines" INTEGER,
    "language_breakdown" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_metrics" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "file_path" TEXT,
    "line_number" INTEGER,
    "rule_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analysis_results_analysis_job_id_key" ON "analysis_results"("analysis_job_id");

-- CreateIndex
CREATE INDEX "code_metrics_analysis_id_file_path_idx" ON "code_metrics"("analysis_id", "file_path");

-- CreateIndex
CREATE INDEX "issues_analysis_id_severity_idx" ON "issues"("analysis_id", "severity");

-- AddForeignKey
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_analysis_job_id_fkey" FOREIGN KEY ("analysis_job_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_metrics" ADD CONSTRAINT "code_metrics_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
