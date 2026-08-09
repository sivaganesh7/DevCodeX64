-- CreateTable
CREATE TABLE "security_scans" (
    "id" UUID NOT NULL,
    "analysis_job_id" UUID NOT NULL,
    "risk_score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependencies" (
    "id" UUID NOT NULL,
    "security_scan_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "package_manager" TEXT NOT NULL,
    "is_direct" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vulnerabilities" (
    "id" UUID NOT NULL,
    "dependency_id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "affected_range" TEXT,
    "description" TEXT,
    "recommendation" TEXT,
    "reference_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vulnerabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_findings" (
    "id" UUID NOT NULL,
    "security_scan_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "line_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_findings" (
    "id" UUID NOT NULL,
    "security_scan_id" UUID NOT NULL,
    "secret_type" TEXT NOT NULL,
    "redacted_value" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "line_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secret_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_findings" (
    "id" UUID NOT NULL,
    "security_scan_id" UUID NOT NULL,
    "dependency_name" TEXT NOT NULL,
    "license_type" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_findings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "security_scans_analysis_job_id_key" ON "security_scans"("analysis_job_id");

-- CreateIndex
CREATE INDEX "dependencies_security_scan_id_name_idx" ON "dependencies"("security_scan_id", "name");

-- CreateIndex
CREATE INDEX "vulnerabilities_dependency_id_severity_idx" ON "vulnerabilities"("dependency_id", "severity");

-- CreateIndex
CREATE INDEX "security_findings_security_scan_id_severity_idx" ON "security_findings"("security_scan_id", "severity");

-- AddForeignKey
ALTER TABLE "security_scans" ADD CONSTRAINT "security_scans_analysis_job_id_fkey" FOREIGN KEY ("analysis_job_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_security_scan_id_fkey" FOREIGN KEY ("security_scan_id") REFERENCES "security_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vulnerabilities" ADD CONSTRAINT "vulnerabilities_dependency_id_fkey" FOREIGN KEY ("dependency_id") REFERENCES "dependencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_findings" ADD CONSTRAINT "security_findings_security_scan_id_fkey" FOREIGN KEY ("security_scan_id") REFERENCES "security_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_findings" ADD CONSTRAINT "secret_findings_security_scan_id_fkey" FOREIGN KEY ("security_scan_id") REFERENCES "security_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_findings" ADD CONSTRAINT "license_findings_security_scan_id_fkey" FOREIGN KEY ("security_scan_id") REFERENCES "security_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
