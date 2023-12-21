/*
  Warnings:

  - Added the required column `ftmStakingId` to the `PrismaSftmxWithdrawalRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PrismaSftmxWithdrawalRequest" DROP CONSTRAINT "PrismaSftmxWithdrawalRequest_id_fkey";

-- AlterTable
ALTER TABLE "PrismaSftmxWithdrawalRequest" ADD COLUMN     "ftmStakingId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PrismaSftmxWithdrawalRequest" ADD CONSTRAINT "PrismaSftmxWithdrawalRequest_ftmStakingId_fkey" FOREIGN KEY ("ftmStakingId") REFERENCES "PrismaSftmxStakingData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
