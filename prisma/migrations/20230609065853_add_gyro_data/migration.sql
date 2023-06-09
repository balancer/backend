-- CreateTable
CREATE TABLE "PrismaPoolGyroData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "alpha" TEXT NOT NULL,
    "beta" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolGyroData_pkey" PRIMARY KEY ("id","chain")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolGyroData_poolId_chain_key" ON "PrismaPoolGyroData"("poolId", "chain");

-- AddForeignKey
ALTER TABLE "PrismaPoolGyroData" ADD CONSTRAINT "PrismaPoolGyroData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;
