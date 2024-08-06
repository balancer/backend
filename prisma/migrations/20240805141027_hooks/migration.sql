-- AlterTable
ALTER TABLE "PrismaPool" ADD COLUMN     "hookId" INTEGER;

-- CreateTable
CREATE TABLE "Hook" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "enableHookAdjustedAmounts" BOOLEAN NOT NULL DEFAULT false,
    "shouldCallAfterSwap" BOOLEAN NOT NULL DEFAULT false,
    "shouldCallBeforeSwap" BOOLEAN NOT NULL DEFAULT false,
    "shouldCallAfterInitialize" BOOLEAN NOT NULL DEFAULT false,
    "shouldCallBeforeInitialize" BOOLEAN NOT NULL DEFAULT false,
    "shouldCallAfterAddLiquidity" BOOLEAN NOT NULL DEFAULT false,
    "shouldCallBeforeAddLiquidity" BOOLEAN NOT NULL DEFAULT false,
    "shouldCallAfterRemoveLiquidity" BOOLEAN NOT NULL DEFAULT false,
    "shouldCallBeforeRemoveLiquidity" BOOLEAN NOT NULL DEFAULT false,
    "shouldCallComputeDynamicSwapFee" BOOLEAN NOT NULL DEFAULT false,
    "dynamicData" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Hook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Hook_id_idx" ON "Hook"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Hook_address_chain_key" ON "Hook"("address", "chain");

-- AddForeignKey
ALTER TABLE "PrismaPool" ADD CONSTRAINT "PrismaPool_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "Hook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
