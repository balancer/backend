/*
  Warnings:

  - The primary key for the `PrismaTokenCurrentPrice` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PrismaTokenCurrentPrice` table. All the data in the column will be lost.
  - The primary key for the `PrismaTokenDynamicData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PrismaTokenDynamicData` table. All the data in the column will be lost.
  - Added the required column `coingeckoId` to the `PrismaTokenDynamicData` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PrismaTokenCurrentPrice_tokenAddress_key";

-- DropIndex
DROP INDEX "PrismaTokenDynamicData_tokenAddress_key";

-- AlterTable
ALTER TABLE "PrismaTokenCurrentPrice" DROP CONSTRAINT "PrismaTokenCurrentPrice_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "PrismaTokenCurrentPrice_pkey" PRIMARY KEY ("tokenAddress");

-- AlterTable
ALTER TABLE "PrismaTokenDynamicData" DROP CONSTRAINT "PrismaTokenDynamicData_pkey",
ADD CONSTRAINT "PrismaTokenDynamicData_pkey" PRIMARY KEY ("tokenAddress");
alter table "PrismaTokenDynamicData" rename column "id" to "coingeckoId";
