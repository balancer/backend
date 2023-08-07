import { PoolStakingService } from '../../pool-types';
import { MasterchefSubgraphService } from '../../../subgraphs/masterchef-subgraph/masterchef.service';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { oldBnum } from '../../../big-number/old-big-number';
import { formatFixed } from '@ethersproject/bignumber';
import { getContractAt } from '../../../web3/contract';
import ERC20Abi from '../../../web3/abi/ERC20.json';
import { BigNumber } from 'ethers';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../../network/network-context.service';

const FARM_EMISSIONS_PERCENT = 0.872;

export class MasterChefStakingService implements PoolStakingService {
    constructor(
        private readonly masterChefSubgraphService: MasterchefSubgraphService,
        private readonly excludedFarmIds: string[],
    ) {}

    public async syncStakingForPools(): Promise<void> {
        const farms = await this.masterChefSubgraphService.getAllFarms({});
        const filteredFarms = farms.filter((farm) => !this.excludedFarmIds.includes(farm.id));
        const pools = await prisma.prismaPool.findMany({
            where: { chain: networkContext.chain },
            include: { staking: { include: { farm: { include: { rewarders: true } } } } },
        });
        const operations: any[] = [];

        for (const farm of filteredFarms) {
            const isFbeetsFarm = farm.id === networkContext.data.fbeets!.farmId;
            const pool = pools.find((pool) =>
                isFbeetsFarm ? pool.id === networkContext.data.fbeets!.poolId : pool.address === farm.pair,
            );

            if (!pool) {
                continue;
            }

            const farmId = farm.id;
            const beetsPerBlock = formatFixed(
                oldBnum(farm.masterChef.beetsPerBlock)
                    .times(FARM_EMISSIONS_PERCENT)
                    .times(farm.allocPoint)
                    .div(farm.masterChef.totalAllocPoint)
                    .toFixed(0),
                18,
            );

            operations.push(
                prisma.prismaPoolStaking.upsert({
                    where: { id_chain: { id: farmId, chain: networkContext.chain } },
                    create: {
                        id: farmId,
                        chain: networkContext.chain,
                        poolId: pool.id,
                        type: isFbeetsFarm ? 'FRESH_BEETS' : 'MASTER_CHEF',
                        address: isFbeetsFarm ? networkContext.data.fbeets!.address : farm.masterChef.id,
                    },
                    update: {},
                }),
            );

            operations.push(
                prisma.prismaPoolStakingMasterChefFarm.upsert({
                    where: { id_chain: { id: farmId, chain: networkContext.chain } },
                    create: { id: farmId, chain: networkContext.chain, stakingId: farmId, beetsPerBlock },
                    update: { beetsPerBlock },
                }),
            );

            if (farm.rewarder) {
                for (const rewardToken of farm.rewarder.rewardTokens || []) {
                    const id = `${farmId}-${farm.rewarder.id}-${rewardToken.token}`;
                    const erc20Token = await getContractAt(rewardToken.token, ERC20Abi);
                    const rewardBalance: BigNumber = await erc20Token.balanceOf(farm.rewarder.id);
                    const rewardPerSecond = rewardBalance.gt(0)
                        ? formatFixed(rewardToken.rewardPerSecond, rewardToken.decimals)
                        : '0.0';

                    operations.push(
                        prisma.prismaPoolStakingMasterChefFarmRewarder.upsert({
                            where: { id_chain: { id, chain: networkContext.chain } },
                            create: {
                                id,
                                chain: networkContext.chain,
                                farmId,
                                tokenAddress: rewardToken.token,
                                address: farm.rewarder.id,
                                rewardPerSecond,
                            },
                            update: { rewardPerSecond },
                        }),
                    );
                }
            }
        }

        await prismaBulkExecuteOperations(operations, true);
    }

    public async reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[]) {
        if (stakingTypes.includes('MASTER_CHEF')) {
            await prisma.prismaUserStakedBalance.deleteMany({
                where: {
                    OR: [
                        { staking: { type: 'MASTER_CHEF' }, chain: networkContext.chain },
                        { staking: { type: 'FRESH_BEETS' }, chain: networkContext.chain },
                    ],
                },
            });
            await prisma.prismaPoolStakingMasterChefFarmRewarder.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaPoolStakingMasterChefFarm.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaPoolStaking.deleteMany({ where: { type: 'MASTER_CHEF', chain: networkContext.chain } });
            await this.syncStakingForPools();
        }
    }
}
