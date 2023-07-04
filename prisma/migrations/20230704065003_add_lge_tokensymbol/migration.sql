/*
  Warnings:

  - Added the required column `collateralSymbol` to the `PrismaLge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenSymbol` to the `PrismaLge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PrismaLge" ADD COLUMN     "collateralSymbol" TEXT NOT NULL,
ADD COLUMN     "tokenSymbol" TEXT NOT NULL;
