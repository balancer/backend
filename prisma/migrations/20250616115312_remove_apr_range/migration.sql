/*
  Warnings:

  - You are about to drop the `PrismaPoolAprRange` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PrismaPoolAprRange" DROP CONSTRAINT "PrismaPoolAprRange_aprItemId_chain_fkey";

-- DropTable
DROP TABLE "PrismaPoolAprRange";
