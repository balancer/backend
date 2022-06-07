-- CreateTable
CREATE TABLE "PrismaTokenData" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "websiteUrl" TEXT,
    "discordUrl" TEXT,
    "telegramUrl" TEXT,
    "twitterUsername" TEXT,

    CONSTRAINT "PrismaTokenData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaTokenData_tokenAddress_key" ON "PrismaTokenData"("tokenAddress");

-- AddForeignKey
ALTER TABLE "PrismaTokenData" ADD CONSTRAINT "PrismaTokenData_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
