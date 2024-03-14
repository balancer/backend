import { prisma } from "../../../prisma/prisma-client";
import { networkContext } from "../../network/network-context.service";
import { SUPPORTED_POOL_TYPES } from "../../pool/lib/pool-on-chain-data.service";
import { Chain } from "@prisma/client";
import { fetchTokenPairDataV3Router } from "../../pool/lib/pool-on-chain-tokenpair-data";
import { prismaBulkExecuteOperations } from "../../../prisma/prisma-util";


//TODO: Move this job to pool-on-chain-data-service with the necessary adaptations
export async function updateOnChainDataV3(chain: Chain){
  const balancerRouterAddress = networkContext.data.balancer.v3.routerAddress;
  const filteredPools = await prisma.prismaPool.findMany({
    where: {
      vaultVersion: 3,
      chain,
      type: { in: SUPPORTED_POOL_TYPES },
    },
    include: {
      tokens: { orderBy: { index: 'asc' }, include: { dynamicData: true, token: true } },
      dynamicData: true,
    },
  });
  //
  const tokenPairDataV3 = await fetchTokenPairDataV3Router(
    filteredPools,
    balancerRouterAddress,
    chain === 'ZKEVM' ? 190 : 1024,
  );
  for (const pool of filteredPools) {
    const operations = [];
  if (pool.dynamicData) {
    const { tokenPairs } = tokenPairDataV3[pool.id];
    operations.push(
      prisma.prismaPoolDynamicData.update({
        where: { id_chain: { id: pool.id, chain} },
        data: {
          tokenPairsData: tokenPairs,
        },
      }),
    );
  }
  await prismaBulkExecuteOperations(operations, false);
  }

}
