-- AlterTable
ALTER TABLE "PrismaPoolSnapshot" ADD COLUMN     "vaultVersion" INTEGER NOT NULL DEFAULT 2;

-- CreateIndex
CREATE INDEX "PrismaPoolSnapshot_vaultVersion_idx" ON "PrismaPoolSnapshot"("vaultVersion");

-- CreateIndex
CREATE INDEX "PrismaPoolSnapshot_timestamp_idx" ON "PrismaPoolSnapshot"("timestamp" DESC);
