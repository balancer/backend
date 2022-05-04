/*
  Warnings:

  - You are about to drop the column `user` on the `PrismaPoolSwap` table. All the data in the column will be lost.
  - Added the required column `userAddress` to the `PrismaPoolSwap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PrismaPoolSwap" DROP COLUMN "user",
ADD COLUMN     "userAddress" TEXT NOT NULL;
