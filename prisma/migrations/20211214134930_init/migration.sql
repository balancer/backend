-- CreateTable
CREATE TABLE "Account" (
    "address" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "LbpEventsAdmins" (
    "adminAddress" TEXT NOT NULL,
    "lbpEventId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LbpEventsAdmins_pkey" PRIMARY KEY ("adminAddress","lbpEventId")
);

-- CreateTable
CREATE TABLE "LbpEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tokenContractAddress" TEXT NOT NULL,
    "collateralTokenAddress" TEXT NOT NULL,
    "tokenAmount" TEXT NOT NULL,
    "collateralAmount" TEXT NOT NULL,
    "tokenStartWeight" DOUBLE PRECISION NOT NULL,
    "collateralStartWeight" DOUBLE PRECISION NOT NULL,
    "tokenEndWeight" DOUBLE PRECISION NOT NULL,
    "collateralEndWeight" DOUBLE PRECISION NOT NULL,
    "swapFeePercentage" DOUBLE PRECISION NOT NULL,
    "poolName" TEXT NOT NULL,
    "poolSymbol" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "tokenIconUrl" TEXT NOT NULL,
    "twitterUrl" TEXT NOT NULL,
    "mediumUrl" TEXT NOT NULL,
    "discordUrl" TEXT NOT NULL,
    "telegramUrl" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LbpEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LbpEventsAdmins" ADD CONSTRAINT "LbpEventsAdmins_adminAddress_fkey" FOREIGN KEY ("adminAddress") REFERENCES "Account"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LbpEventsAdmins" ADD CONSTRAINT "LbpEventsAdmins_lbpEventId_fkey" FOREIGN KEY ("lbpEventId") REFERENCES "LbpEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
