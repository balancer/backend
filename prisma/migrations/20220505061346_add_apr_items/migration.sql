-- CreateTable
CREATE TABLE "PrismaPoolAprItem" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,
    "parentItemId" TEXT,

    CONSTRAINT "PrismaPoolAprItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaPoolAprItem" ADD CONSTRAINT "PrismaPoolAprItem_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolAprItem" ADD CONSTRAINT "PrismaPoolAprItem_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "PrismaPoolAprItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
