-- AlterTable
ALTER TABLE "PrismaPool" ADD COLUMN     "poolTypeSpecificData" JSONB NOT NULL DEFAULT '{}';
