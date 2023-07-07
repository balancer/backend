-- CreateTable
CREATE TABLE "PrismaLge" (
    "id" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "tokenIconUrl" TEXT NOT NULL,
    "bannerImageUrl" TEXT NOT NULL,
    "twitterUrl" TEXT NOT NULL,
    "mediumUrl" TEXT NOT NULL,
    "discordUrl" TEXT NOT NULL,
    "telegramUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startTimestamp" INTEGER NOT NULL,
    "endTimestamp" INTEGER NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "tokenDecimals" INTEGER NOT NULL,
    "tokenAmount" TEXT NOT NULL,
    "tokenStartWeight" DOUBLE PRECISION NOT NULL,
    "tokenEndWeight" DOUBLE PRECISION NOT NULL,
    "collateralAddress" TEXT NOT NULL,
    "collateralDecimals" INTEGER NOT NULL,
    "collateralAmount" TEXT NOT NULL,
    "collateralStartWeight" DOUBLE PRECISION NOT NULL,
    "collateralEndWeight" DOUBLE PRECISION NOT NULL,
    "swapFee" TEXT NOT NULL,
    "adminAddress" TEXT NOT NULL,
    "adminIsMultisig" BOOLEAN NOT NULL,

    CONSTRAINT "PrismaLge_pkey" PRIMARY KEY ("id","chain")
);

-- CreateTable
CREATE TABLE "PrismaLgePriceData" (
    "id" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "swapTransaction" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "launchTokenPrice" DOUBLE PRECISION NOT NULL,
    "tokenBalance" TEXT NOT NULL,
    "collateralBalance" TEXT NOT NULL,

    CONSTRAINT "PrismaLgePriceData_pkey" PRIMARY KEY ("id","chain","swapTransaction")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaLge_address_key" ON "PrismaLge"("address");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaLge_address_chain_key" ON "PrismaLge"("address", "chain");

-- AddForeignKey
ALTER TABLE "PrismaLgePriceData" ADD CONSTRAINT "PrismaLgePriceData_id_chain_fkey" FOREIGN KEY ("id", "chain") REFERENCES "PrismaLge"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;
