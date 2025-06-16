/*
  Warnings:

  - You are about to drop the column `group` on the `PrismaPoolAprItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PrismaPoolAprItem" DROP COLUMN "group";

-- DropEnum
DROP TYPE "PrismaPoolAprItemGroup";
