/*
  Warnings:

  - Added the required column `vaultIndex` to the `PrismaSftmxVault` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PrismaSftmxVault" ADD COLUMN     "vaultIndex" INTEGER NOT NULL;
