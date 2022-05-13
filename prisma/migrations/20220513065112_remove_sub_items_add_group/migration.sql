/*
  Warnings:

  - You are about to drop the column `parentItemId` on the `PrismaPoolAprItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PrismaPoolAprItemGroup" AS ENUM ('YEARN');

-- DropForeignKey
ALTER TABLE "PrismaPoolAprItem" DROP CONSTRAINT "PrismaPoolAprItem_parentItemId_fkey";

-- AlterTable
ALTER TABLE "PrismaPoolAprItem" DROP COLUMN "parentItemId",
ADD COLUMN     "group" "PrismaPoolAprItemGroup";
