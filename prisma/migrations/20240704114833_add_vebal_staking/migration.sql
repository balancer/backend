-- AlterEnum
ALTER TYPE "PrismaPoolStakingType" ADD VALUE 'VEBAL';

-- AlterEnum
ALTER TYPE "PrismaUserBalanceType" ADD VALUE 'VEBAL';

-- CreateTable
CREATE TABLE "PrismaPoolStakingVebal" (
    "id" TEXT NOT NULL,
    "stakingId" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "vebalAddress" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolStakingVebal_pkey" PRIMARY KEY ("id","chain")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStakingVebal_stakingId_chain_key" ON "PrismaPoolStakingVebal"("stakingId", "chain");

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingVebal" ADD CONSTRAINT "PrismaPoolStakingVebal_stakingId_chain_fkey" FOREIGN KEY ("stakingId", "chain") REFERENCES "PrismaPoolStaking"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;
