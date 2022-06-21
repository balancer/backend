/*
  Warnings:

  - You are about to drop the column `balanceScaled` on the `PrismaUserStakedBalance` table. All the data in the column will be lost.
  - You are about to drop the column `balanceScaled` on the `PrismaUserWalletBalance` table. All the data in the column will be lost.
  - Added the required column `balanceNum` to the `PrismaUserStakedBalance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceNum` to the `PrismaUserWalletBalance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PrismaUserStakedBalance" DROP COLUMN "balanceScaled",
ADD COLUMN     "balanceNum" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "PrismaUserWalletBalance" DROP COLUMN "balanceScaled",
ADD COLUMN     "balanceNum" DOUBLE PRECISION NOT NULL;
