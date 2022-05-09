/*
  Warnings:

  - Added the required column `decimals` to the `PrismaToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `close` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `high` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `low` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `open` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `price` on the `PrismaTokenPrice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PrismaTokenTypeOption" AS ENUM ('WHITE_LISTED', 'BPT', 'PHANTOM_BPT', 'LINEAR_WRAPPED_TOKEN');

-- DropIndex
DROP INDEX "PrismaTokenPrice_tokenAddress_timestamp_key";

-- AlterTable
ALTER TABLE "PrismaToken" ADD COLUMN     "coingeckoContractAddress" TEXT,
ADD COLUMN     "coingeckoPlatformId" TEXT,
ADD COLUMN     "decimals" INTEGER NOT NULL,
ADD COLUMN     "logoURI" TEXT;

-- AlterTable
ALTER TABLE "PrismaTokenPrice" ADD COLUMN     "close" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coingecko" BOOLEAN,
ADD COLUMN     "high" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "low" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "open" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "price",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD CONSTRAINT "PrismaTokenPrice_pkey" PRIMARY KEY ("tokenAddress", "timestamp");

-- CreateTable
CREATE TABLE "PrismaTokenType" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "type" "PrismaTokenTypeOption" NOT NULL,

    CONSTRAINT "PrismaTokenType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaTokenType_tokenAddress_type_key" ON "PrismaTokenType"("tokenAddress", "type");

-- AddForeignKey
ALTER TABLE "PrismaTokenType" ADD CONSTRAINT "PrismaTokenType_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
