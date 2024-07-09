/*
  Warnings:

  - You are about to drop the `PrismaPoolCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PrismaPoolCategory" DROP CONSTRAINT "PrismaPoolCategory_poolId_chain_fkey";

-- AlterTable
ALTER TABLE "PrismaPool" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "PrismaPoolCategory";

-- DropEnum
DROP TYPE "PrismaPoolCategoryType";
