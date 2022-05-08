-- CreateEnum
CREATE TYPE "PrismaPoolType" AS ENUM ('WEIGHTED', 'STABLE', 'META_STABLE', 'PHANTOM_STABLE', 'ELEMENT', 'LINEAR', 'UNKNOWN', 'LIQUIDITY_BOOTSTRAPPING', 'INVESTMENT');

-- CreateTable
CREATE TABLE "PrismaPool" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PrismaPoolType" NOT NULL,
    "owner" TEXT NOT NULL,
    "factory" TEXT,

    CONSTRAINT "PrismaPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolLinearData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "mainIndex" INTEGER NOT NULL,
    "wrappedIndex" INTEGER NOT NULL,

    CONSTRAINT "PrismaPoolLinearData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolElementData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "unitSeconds" TEXT NOT NULL,
    "principalToken" TEXT NOT NULL,
    "baseToken" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolElementData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolDynamicData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "swapFee" TEXT NOT NULL,
    "swapEnabled" BOOLEAN NOT NULL,
    "totalShares" TEXT NOT NULL,
    "totalLiquidity" TEXT NOT NULL,
    "volume24h" TEXT NOT NULL,
    "fees24h" TEXT NOT NULL,
    "totalSwapFee" TEXT NOT NULL,
    "totalSwapVolume" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolDynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolStableDynamicData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amp" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolStableDynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolLinearDynamicData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lowerTarget" TEXT NOT NULL,
    "upperTarget" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolLinearDynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolToken" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "nestedPoolId" TEXT,

    CONSTRAINT "PrismaPoolToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolTokenDynamicData" (
    "id" TEXT NOT NULL,
    "poolTokenId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "balance" TEXT NOT NULL,
    "balanceUSD" TEXT NOT NULL,
    "weight" TEXT,
    "priceRate" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolTokenDynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPool_address_key" ON "PrismaPool"("address");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolLinearData_poolId_key" ON "PrismaPoolLinearData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolElementData_poolId_key" ON "PrismaPoolElementData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolDynamicData_poolId_key" ON "PrismaPoolDynamicData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStableDynamicData_poolId_key" ON "PrismaPoolStableDynamicData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolLinearDynamicData_poolId_key" ON "PrismaPoolLinearDynamicData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolTokenDynamicData_poolTokenId_key" ON "PrismaPoolTokenDynamicData"("poolTokenId");

-- AddForeignKey
ALTER TABLE "PrismaPoolLinearData" ADD CONSTRAINT "PrismaPoolLinearData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolElementData" ADD CONSTRAINT "PrismaPoolElementData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolDynamicData" ADD CONSTRAINT "PrismaPoolDynamicData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStableDynamicData" ADD CONSTRAINT "PrismaPoolStableDynamicData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolLinearDynamicData" ADD CONSTRAINT "PrismaPoolLinearDynamicData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_nestedPoolId_fkey" FOREIGN KEY ("nestedPoolId") REFERENCES "PrismaPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolTokenDynamicData" ADD CONSTRAINT "PrismaPoolTokenDynamicData_poolTokenId_fkey" FOREIGN KEY ("poolTokenId") REFERENCES "PrismaPoolToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
