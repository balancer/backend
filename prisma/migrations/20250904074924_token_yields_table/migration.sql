-- CreateTable
CREATE TABLE "PrismaTokenYield" (
    "address" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrismaTokenYield_pkey" PRIMARY KEY ("address","chain")
);

-- CreateIndex
CREATE INDEX "PrismaTokenYield_chain_address_idx" ON "PrismaTokenYield"("chain", "address");
