-- CreateTable
CREATE TABLE "PrismaPoolExpandedTokens" (
    "tokenAddress" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolExpandedTokens_pkey" PRIMARY KEY ("tokenAddress","poolId")
);

-- AddForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" ADD CONSTRAINT "PrismaPoolExpandedTokens_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" ADD CONSTRAINT "PrismaPoolExpandedTokens_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
