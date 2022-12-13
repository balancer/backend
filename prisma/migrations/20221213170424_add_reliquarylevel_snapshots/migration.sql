-- CreateTable
CREATE TABLE "PrismaReliquaryLevelSnapshot" (
    "id" TEXT NOT NULL,
    "farmSnapshotId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "balance" TEXT NOT NULL,

    CONSTRAINT "PrismaReliquaryLevelSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaReliquaryLevelSnapshot" ADD CONSTRAINT "PrismaReliquaryLevelSnapshot_farmSnapshotId_fkey" FOREIGN KEY ("farmSnapshotId") REFERENCES "PrismaReliquaryFarmSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
