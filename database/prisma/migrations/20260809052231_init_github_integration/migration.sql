-- CreateTable
CREATE TABLE "github_integrations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "github_user_id" TEXT NOT NULL,
    "github_username" TEXT NOT NULL,
    "installation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_integrations_user_id_key" ON "github_integrations"("user_id");

-- AddForeignKey
ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
