-- CreateTable
CREATE TABLE "PrismaPoolAprRange" (
    "id" TEXT NOT NULL,
    "aprItemId" TEXT NOT NULL,
    "min" DOUBLE PRECISION NOT NULL,
    "max" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PrismaPoolAprRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolAprRange_aprItemId_key" ON "PrismaPoolAprRange"("aprItemId");

-- AddForeignKey
ALTER TABLE "PrismaPoolAprRange" ADD CONSTRAINT "PrismaPoolAprRange_aprItemId_fkey" FOREIGN KEY ("aprItemId") REFERENCES "PrismaPoolAprItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
