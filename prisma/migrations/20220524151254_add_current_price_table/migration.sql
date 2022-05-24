-- CreateTable
CREATE TABLE "PrismaTokenCurrentPrice" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "coingecko" BOOLEAN,

    CONSTRAINT "PrismaTokenCurrentPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaTokenCurrentPrice_tokenAddress_key" ON "PrismaTokenCurrentPrice"("tokenAddress");

-- AddForeignKey
ALTER TABLE "PrismaTokenCurrentPrice" ADD CONSTRAINT "PrismaTokenCurrentPrice_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
