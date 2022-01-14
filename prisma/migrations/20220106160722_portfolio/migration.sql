-- CreateTable
CREATE TABLE "PrismaBlock" (
    "number" INTEGER NOT NULL,
    "id" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,

    CONSTRAINT "PrismaBlock_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "PrismaToken" (
    "address" TEXT NOT NULL,

    CONSTRAINT "PrismaToken_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "PrismaTokenPrice" (
    "tokenAddress" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "price" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PrismaUser" (
    "address" TEXT NOT NULL,

    CONSTRAINT "PrismaUser_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "PrismaBalancerPool" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT,

    CONSTRAINT "PrismaBalancerPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaBalancerPoolSnapshot" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "swapFee" TEXT NOT NULL,
    "totalSwapVolume" TEXT NOT NULL,
    "totalSwapFee" TEXT NOT NULL,
    "totalLiquidity" TEXT NOT NULL,
    "totalShares" TEXT NOT NULL,
    "swapsCount" TEXT NOT NULL,
    "holdersCount" TEXT NOT NULL,
    "swapEnabled" BOOLEAN NOT NULL,
    "amp" TEXT,

    CONSTRAINT "PrismaBalancerPoolSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaBalancerPoolTokenSnapshot" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "balance" TEXT NOT NULL,
    "invested" TEXT NOT NULL,

    CONSTRAINT "PrismaBalancerPoolTokenSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaBalancerPoolShareSnapshot" (
    "userAddress" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "poolSnapshotId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "balance" TEXT NOT NULL,

    CONSTRAINT "PrismaBalancerPoolShareSnapshot_pkey" PRIMARY KEY ("userAddress","poolId","blockNumber")
);

-- CreateTable
CREATE TABLE "PrismaFarm" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "poolId" TEXT,

    CONSTRAINT "PrismaFarm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaFarmUser" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,

    CONSTRAINT "PrismaFarmUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaFarmUserSnapshot" (
    "userAddress" TEXT NOT NULL,
    "farmUserId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "farmId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "rewardDebt" TEXT NOT NULL,
    "beetsHarvested" TEXT NOT NULL,

    CONSTRAINT "PrismaFarmUserSnapshot_pkey" PRIMARY KEY ("userAddress","farmUserId","farmId","blockNumber")
);

-- CreateTable
CREATE TABLE "PrismaBeetsBarSnapshot" (
    "blockNumber" INTEGER NOT NULL,
    "fBeetsBurned" TEXT NOT NULL,
    "fBeetsMinted" TEXT NOT NULL,
    "ratio" TEXT NOT NULL,
    "totalSupply" TEXT NOT NULL,
    "vestingTokenStaked" TEXT NOT NULL,
    "sharedVestingTokenRevenue" TEXT NOT NULL,

    CONSTRAINT "PrismaBeetsBarSnapshot_pkey" PRIMARY KEY ("blockNumber")
);

-- CreateTable
CREATE TABLE "PrismaBeetsBarUserSnapshot" (
    "address" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "fBeets" TEXT NOT NULL,
    "vestingTokenHarvested" TEXT NOT NULL,
    "vestingTokenIn" TEXT NOT NULL,
    "vestingTokenOut" TEXT NOT NULL,

    CONSTRAINT "PrismaBeetsBarUserSnapshot_pkey" PRIMARY KEY ("blockNumber")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaBlock_id_key" ON "PrismaBlock"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaTokenPrice_tokenAddress_timestamp_key" ON "PrismaTokenPrice"("tokenAddress", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaBalancerPool_address_key" ON "PrismaBalancerPool"("address");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaBalancerPoolSnapshot_poolId_blockNumber_key" ON "PrismaBalancerPoolSnapshot"("poolId", "blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaFarm_pair_key" ON "PrismaFarm"("pair");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaFarm_poolId_key" ON "PrismaFarm"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaFarmUser_userAddress_farmId_key" ON "PrismaFarmUser"("userAddress", "farmId");

-- AddForeignKey
ALTER TABLE "PrismaTokenPrice" ADD CONSTRAINT "PrismaTokenPrice_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolSnapshot" ADD CONSTRAINT "PrismaBalancerPoolSnapshot_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaBalancerPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolSnapshot" ADD CONSTRAINT "PrismaBalancerPoolSnapshot_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "PrismaBlock"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolTokenSnapshot" ADD CONSTRAINT "PrismaBalancerPoolTokenSnapshot_address_fkey" FOREIGN KEY ("address") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolTokenSnapshot" ADD CONSTRAINT "PrismaBalancerPoolTokenSnapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "PrismaBalancerPoolSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolTokenSnapshot" ADD CONSTRAINT "PrismaBalancerPoolTokenSnapshot_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaBalancerPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolTokenSnapshot" ADD CONSTRAINT "PrismaBalancerPoolTokenSnapshot_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "PrismaBlock"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolShareSnapshot" ADD CONSTRAINT "PrismaBalancerPoolShareSnapshot_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolShareSnapshot" ADD CONSTRAINT "PrismaBalancerPoolShareSnapshot_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaBalancerPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolShareSnapshot" ADD CONSTRAINT "PrismaBalancerPoolShareSnapshot_poolSnapshotId_fkey" FOREIGN KEY ("poolSnapshotId") REFERENCES "PrismaBalancerPoolSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBalancerPoolShareSnapshot" ADD CONSTRAINT "PrismaBalancerPoolShareSnapshot_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "PrismaBlock"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaFarm" ADD CONSTRAINT "PrismaFarm_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaBalancerPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaFarmUser" ADD CONSTRAINT "PrismaFarmUser_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaFarmUser" ADD CONSTRAINT "PrismaFarmUser_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "PrismaFarm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaFarmUserSnapshot" ADD CONSTRAINT "PrismaFarmUserSnapshot_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaFarmUserSnapshot" ADD CONSTRAINT "PrismaFarmUserSnapshot_farmUserId_fkey" FOREIGN KEY ("farmUserId") REFERENCES "PrismaFarmUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaFarmUserSnapshot" ADD CONSTRAINT "PrismaFarmUserSnapshot_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "PrismaBlock"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaFarmUserSnapshot" ADD CONSTRAINT "PrismaFarmUserSnapshot_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "PrismaFarm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBeetsBarSnapshot" ADD CONSTRAINT "PrismaBeetsBarSnapshot_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "PrismaBlock"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBeetsBarUserSnapshot" ADD CONSTRAINT "PrismaBeetsBarUserSnapshot_address_fkey" FOREIGN KEY ("address") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaBeetsBarUserSnapshot" ADD CONSTRAINT "PrismaBeetsBarUserSnapshot_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "PrismaBlock"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
