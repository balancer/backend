/*
  Warnings:

  - You are about to drop the column `decimals` on the `PrismaPoolToken` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `PrismaPoolToken` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `PrismaPoolToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PrismaPoolToken" DROP COLUMN "decimals",
DROP COLUMN "name",
DROP COLUMN "symbol";

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_address_fkey" FOREIGN KEY ("address") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
