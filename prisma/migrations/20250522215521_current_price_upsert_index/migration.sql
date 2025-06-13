/*
  Warnings:

  - A unique constraint covering the columns `[tokenAddress,chain]` on the table `PrismaTokenCurrentPrice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PrismaTokenCurrentPrice_tokenAddress_chain_key" ON "PrismaTokenCurrentPrice"("tokenAddress", "chain");
