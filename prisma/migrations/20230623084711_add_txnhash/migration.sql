/*
  Warnings:

  - The primary key for the `PrismaLgePriceData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `swapTransaction` to the `PrismaLgePriceData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PrismaLgePriceData" DROP CONSTRAINT "PrismaLgePriceData_pkey",
ADD COLUMN     "swapTransaction" TEXT NOT NULL,
ADD CONSTRAINT "PrismaLgePriceData_pkey" PRIMARY KEY ("id", "chain", "swapTransaction");
