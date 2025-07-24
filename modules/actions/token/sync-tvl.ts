import { prisma } from '../../../prisma/prisma-client';

export const syncTvl = async () => {
    await prisma.$executeRaw`UPDATE "PrismaToken"
  SET tvl = COALESCE(tvl_data.tvl, 0)
  FROM (
      SELECT
          address,
          chain,
          SUM("balanceUSD") AS tvl
      FROM "PrismaPoolToken"
      GROUP BY address, chain
  ) AS tvl_data
  WHERE "PrismaToken".address = tvl_data.address
    AND "PrismaToken".chain = tvl_data.chain`;

    return 'OK';
};
