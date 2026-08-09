-- CreateTable
CREATE TABLE "ml_risk_predictions" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "risk_probability" DOUBLE PRECISION NOT NULL,
    "risk_level" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_risk_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_risk_factors" (
    "id" UUID NOT NULL,
    "prediction_id" UUID NOT NULL,
    "feature" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "impact" TEXT NOT NULL,

    CONSTRAINT "ml_risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ml_risk_predictions_analysis_id_file_id_key" ON "ml_risk_predictions"("analysis_id", "file_id");

-- AddForeignKey
ALTER TABLE "ml_risk_predictions" ADD CONSTRAINT "ml_risk_predictions_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_risk_predictions" ADD CONSTRAINT "ml_risk_predictions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "repository_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_risk_factors" ADD CONSTRAINT "ml_risk_factors_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "ml_risk_predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
