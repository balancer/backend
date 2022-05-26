-- CreateEnum
CREATE TYPE "PrismaPoolStakingType" AS ENUM ('MASTER_CHEF', 'GAUGE');

-- CreateTable
CREATE TABLE "PrismaPoolStaking" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "type" "PrismaPoolStakingType" NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolStaking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStaking_poolId_key" ON "PrismaPoolStaking"("poolId");

-- AddForeignKey
ALTER TABLE "PrismaPoolStaking" ADD CONSTRAINT "PrismaPoolStaking_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
