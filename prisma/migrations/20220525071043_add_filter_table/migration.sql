-- CreateTable
CREATE TABLE "PrismaPoolFilter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolFilterMap" (
    "id" TEXT NOT NULL,
    "filterId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolFilterMap_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaPoolFilterMap" ADD CONSTRAINT "PrismaPoolFilterMap_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "PrismaPoolFilter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolFilterMap" ADD CONSTRAINT "PrismaPoolFilterMap_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
