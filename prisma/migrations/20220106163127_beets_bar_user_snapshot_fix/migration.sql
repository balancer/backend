/*
  Warnings:

  - The primary key for the `PrismaBeetsBarUserSnapshot` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "PrismaBeetsBarUserSnapshot" DROP CONSTRAINT "PrismaBeetsBarUserSnapshot_pkey",
ADD CONSTRAINT "PrismaBeetsBarUserSnapshot_pkey" PRIMARY KEY ("address", "blockNumber");
