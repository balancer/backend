-- CreateTable
CREATE TABLE "PrismaLoopsData" (
    "id" TEXT NOT NULL,
    "nav" TEXT NOT NULL,
    "actualSupply" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "collateralAmount" TEXT NOT NULL,
    "collateralAmountInEth" TEXT NOT NULL,
    "debtAmount" TEXT NOT NULL,
    "healthFactor" TEXT NOT NULL,
    "loanToValue" TEXT NOT NULL,
    "leverage" DOUBLE PRECISION NOT NULL,
    "totalApr" DOUBLE PRECISION NOT NULL,
    "meritApr" DOUBLE PRECISION NOT NULL,
    "borrowApr" DOUBLE PRECISION NOT NULL,
    "stsAaveMarketCap" TEXT NOT NULL,
    "stsAaveMarketSupply" TEXT NOT NULL,
    "stsAaveMarketMaxLTV" TEXT NOT NULL,

    CONSTRAINT "PrismaLoopsData_pkey" PRIMARY KEY ("id")
);
