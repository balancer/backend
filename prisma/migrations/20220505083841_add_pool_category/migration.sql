-- CreateEnum
CREATE TYPE "PrismaPoolCategoryType" AS ENUM ('INCENTIVIZED', 'BLACK_LISTED', 'FEATURED', 'HOME_FEATURED');

-- CreateTable
CREATE TABLE "PrismaPoolCategory" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "category" "PrismaPoolCategoryType" NOT NULL,

    CONSTRAINT "PrismaPoolCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaPoolCategory" ADD CONSTRAINT "PrismaPoolCategory_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
