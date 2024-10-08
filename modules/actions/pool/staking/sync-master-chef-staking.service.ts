import { MasterchefSubgraphService } from '../../../subgraphs/masterchef-subgraph/masterchef.service';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { oldBnum } from '../../../big-number/old-big-number';
import { formatFixed } from '@ethersproject/bignumber';
import { getContractAt } from '../../../web3/contract';
import ERC20Abi from '../../../web3/abi/ERC20.json';
import { BigNumber } from 'ethers';
import { Chain, PrismaPoolStakingType } from '@prisma/client';

const FARM_EMISSIONS_PERCENT = 0.872;

export const syncMasterchefStakingForPools = async (
    chain: Chain,
    masterChefSubgraphService: MasterchefSubgraphService,
    excludedFarmIds: string[],
    fBeetsAddress: string,
    fBeetsFarmId: string,
    fBeetsPoolId: string,
): Promise<void> => {
    if (chain !== 'FANTOM') {
        return;
    }
    const farms = await masterChefSubgraphService.getAllFarms({});
    const filteredFarms = farms.filter((farm) => !excludedFarmIds.includes(farm.id));
    const pools = await prisma.prismaPool.findMany({
        where: { chain: chain },
        include: { staking: { include: { farm: { include: { rewarders: true } } } } },
    });
    const operations: any[] = [];

    for (const farm of filteredFarms) {
        const isFbeetsFarm = farm.id === fBeetsFarmId;
        const pool = pools.find((pool) => (isFbeetsFarm ? pool.id === fBeetsPoolId : pool.address === farm.pair));

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

        const dbStaking = pool.staking.find((farm) => farm.id === farmId);

        if (!dbStaking) {
            operations.push(
                prisma.prismaPoolStaking.upsert({
                    where: { id_chain: { id: farmId, chain: chain } },
                    create: {
                        id: farmId,
                        chain: chain,
                        poolId: pool.id,
                        type: isFbeetsFarm ? 'FRESH_BEETS' : 'MASTER_CHEF',
                        address: isFbeetsFarm ? fBeetsAddress : farm.masterChef.id,
                    },
                    update: {},
                }),
            );
        }

        if (!dbStaking || !dbStaking.farm || dbStaking.farm.beetsPerBlock !== beetsPerBlock)
            operations.push(
                prisma.prismaPoolStakingMasterChefFarm.upsert({
                    where: { id_chain: { id: farmId, chain: chain } },
                    create: { id: farmId, chain: chain, stakingId: farmId, beetsPerBlock },
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

                if (
                    !dbStaking ||
                    !dbStaking.farm ||
                    dbStaking.farm.rewarders.find((rewarder) => rewarder.id === id)?.rewardPerSecond !== rewardPerSecond
                )
                    operations.push(
                        prisma.prismaPoolStakingMasterChefFarmRewarder.upsert({
                            where: { id_chain: { id, chain: chain } },
                            create: {
                                id,
                                chain: chain,
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
};

export const deleteMasterchefStakingForAllPools = async (stakingTypes: PrismaPoolStakingType[], chain: Chain) => {
    if (chain !== 'FANTOM') {
        return;
    }
    if (stakingTypes.includes('MASTER_CHEF')) {
        await prisma.prismaUserStakedBalance.deleteMany({
            where: {
                OR: [
                    { staking: { type: 'MASTER_CHEF' }, chain: chain },
                    { staking: { type: 'FRESH_BEETS' }, chain: chain },
                ],
            },
        });
        await prisma.prismaPoolStakingMasterChefFarmRewarder.deleteMany({
            where: { chain: chain },
        });
        await prisma.prismaPoolStakingMasterChefFarm.deleteMany({ where: { chain: chain } });
        await prisma.prismaPoolStaking.deleteMany({
            where: { type: 'MASTER_CHEF', chain: chain },
        });
    }
};
