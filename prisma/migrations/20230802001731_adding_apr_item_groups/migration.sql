-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'IDLE';
ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'TRANCHESS';
ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'GEARBOX';
ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'AAVE';
ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'ANKR';
ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'TESSERA';
ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'TETU';
ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'OVIX';
ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'EULER';
ALTER TYPE "PrismaPoolAprItemGroup" ADD VALUE 'DEFAULT';
