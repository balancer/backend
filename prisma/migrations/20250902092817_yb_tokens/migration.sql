-- CreateTable
CREATE TABLE "PrismaYbToken" (
    "address" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrismaYbToken_pkey" PRIMARY KEY ("address","chain")
);

-- CreateIndex
CREATE INDEX "PrismaYbToken_chain_address_idx" ON "PrismaYbToken"("chain", "address");
