/*
  Warnings:

  - The primary key for the `PrismaLgePriceData` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "PrismaLgePriceData" DROP CONSTRAINT "PrismaLgePriceData_pkey",
ADD CONSTRAINT "PrismaLgePriceData_pkey" PRIMARY KEY ("id", "chain", "timestamp");
