/*
  Warnings:

  - You are about to drop the column `createdAt` on the `PrismaPool` table. All the data in the column will be lost.
  - Added the required column `createTime` to the `PrismaPool` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PrismaPool" DROP COLUMN "createdAt",
ADD COLUMN     "createTime" INTEGER NOT NULL;
