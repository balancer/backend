-- AlterEnum
ALTER TYPE "PrismaPoolStakingType" ADD VALUE 'AURA';

-- CreateTable
CREATE TABLE "PrismaPoolStakingAura" (
    "id" TEXT NOT NULL,
    "stakingId" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "auraPoolAddress" TEXT NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,
    "isShutdown" BOOLEAN NOT NULL,

    CONSTRAINT "PrismaPoolStakingAura_pkey" PRIMARY KEY ("id","chain")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStakingAura_stakingId_chain_key" ON "PrismaPoolStakingAura"("stakingId", "chain");

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingAura" ADD CONSTRAINT "PrismaPoolStakingAura_stakingId_chain_fkey" FOREIGN KEY ("stakingId", "chain") REFERENCES "PrismaPoolStaking"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;
