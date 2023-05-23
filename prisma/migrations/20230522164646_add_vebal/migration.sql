-- CreateTable
CREATE TABLE "PrismaVeBalUserBalance" (
    "id" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "balance" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,

    CONSTRAINT "PrismaVeBalUserBalance_pkey" PRIMARY KEY ("id","chain")
);

-- CreateTable
CREATE TABLE "PrismaVeBalTotalSupply" (
    "address" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "totalSupply" TEXT NOT NULL,

    CONSTRAINT "PrismaVeBalTotalSupply_pkey" PRIMARY KEY ("address","chain")
);

-- AddForeignKey
ALTER TABLE "PrismaVeBalUserBalance" ADD CONSTRAINT "PrismaVeBalUserBalance_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
