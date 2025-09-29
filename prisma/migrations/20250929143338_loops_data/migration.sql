/*
  Warnings:

  - You are about to drop the column `borrowApr` on the `PrismaLoopsData` table. All the data in the column will be lost.
  - You are about to drop the column `loanToValue` on the `PrismaLoopsData` table. All the data in the column will be lost.
  - You are about to drop the column `meritApr` on the `PrismaLoopsData` table. All the data in the column will be lost.
  - You are about to drop the column `stsAaveMarketCap` on the `PrismaLoopsData` table. All the data in the column will be lost.
  - You are about to drop the column `stsAaveMarketMaxLTV` on the `PrismaLoopsData` table. All the data in the column will be lost.
  - Added the required column `stsAaveMarketSupplyCap` to the `PrismaLoopsData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tvl` to the `PrismaLoopsData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wSAaveMarketBorrowCap` to the `PrismaLoopsData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wSAaveMarketBorrowed` to the `PrismaLoopsData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wSAaveMarketSupplyCap` to the `PrismaLoopsData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PrismaLoopsData" DROP COLUMN "borrowApr",
DROP COLUMN "loanToValue",
DROP COLUMN "meritApr",
DROP COLUMN "stsAaveMarketCap",
DROP COLUMN "stsAaveMarketMaxLTV",
ADD COLUMN     "stsAaveMarketSupplyCap" TEXT NOT NULL,
ADD COLUMN     "tvl" TEXT NOT NULL,
ADD COLUMN     "wSAaveMarketBorrowCap" TEXT NOT NULL,
ADD COLUMN     "wSAaveMarketBorrowed" TEXT NOT NULL,
ADD COLUMN     "wSAaveMarketSupplyCap" TEXT NOT NULL;
