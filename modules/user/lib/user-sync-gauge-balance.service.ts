import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import RewardsOnlyGaugeAbi from './abi/RewardsOnlyGauge.json';
import { Multicaller } from '../../web3/multicaller';
import { formatFixed } from '@ethersproject/bignumber';
import { Chain, PrismaPoolStakingType } from '@prisma/client';
import ERC20Abi from '../../web3/abi/ERC20.json';
import { zeroAddress as AddressZero } from 'viem';
import { getEvents } from '../../web3/events';
import { GaugeSubgraphService } from '../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { BALANCES_SYNC_BLOCKS_MARGIN } from '../../../config';
import { getViemClient } from '../../sources/viem-client';
import config from '../../../config';
import { ethers } from 'ethers';
import { getLastSyncedBlock } from '../../actions/last-synced-block';

export class UserSyncGaugeBalanceService implements UserStakedBalanceService {
    constructor() {}

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void> {
        if (!stakingTypes.includes('GAUGE')) {
            return;
        }

        // Get pools from DB, some old gauges don't have pool ID associated with the share
        const pools = await prisma.prismaPool.findMany({
            select: { id: true, address: true },
            where: { chain },
        });

        // Map the pools address to id
        const poolsMap = new Map(pools.map((pool) => [pool.address, pool.id]));

        // Get the shares
        const gaugeSubgraphService = new GaugeSubgraphService(config[chain].subgraphs.gauge!);
        const blockNumber = await gaugeSubgraphService.lastSyncedBlock();
        const lastSyncedBlock = await getLastSyncedBlock(chain, 'GAUGE_BALANCES');

        console.log(`[GaugeBalancesSync] ${chain} from ${lastSyncedBlock} to ${blockNumber}`);
        const gaugeShares = await gaugeSubgraphService.getAllGaugeShares(
            lastSyncedBlock
                ? {
                      _change_block: {
                          number_gte: lastSyncedBlock,
                      },
                  }
                : undefined,
        );

        // Select shares that we know have a pool
        const filteredGaugeShares = gaugeShares.filter((share) => {
            const pool = poolsMap.get(share.gauge.poolAddress);
            if (pool) {
                return true;
            }
        });

        console.log(`[GaugeBalancesSync] found ${filteredGaugeShares.length} shares`);

        // Transform the data
        const balances = filteredGaugeShares.map((share) => ({
            id: `${share.gauge.id}-${share.user.id}`,
            chain,
            balance: share.balance,
            balanceNum: parseFloat(share.balance),
            userAddress: share.user.id,
            poolId: poolsMap.get(share.gauge.poolAddress)!,
            tokenAddress: share.gauge.poolAddress,
            stakingId: share.gauge.id,
        }));

        // Prepare inserts
        const obsoleteIDs = balances.filter((share) => share.balanceNum === 0).map(({ id }) => id);
        const userAddresses = _.uniq(balances.map((share) => share.userAddress)).map((userAddress) => ({
            address: userAddress,
        }));

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: userAddresses,
                    skipDuplicates: true,
                }),

                prisma.prismaPoolStaking.createMany({
                    data: balances.map((share) => ({
                        id: share.stakingId,
                        address: share.stakingId,
                        poolId: share.poolId,
                        chain,
                        type: 'GAUGE',
                    })),
                    skipDuplicates: true,
                }),

                prisma.prismaPoolStakingGauge.createMany({
                    data: balances.map((share) => ({
                        id: share.stakingId,
                        gaugeAddress: share.stakingId,
                        stakingId: share.stakingId,
                        chain,
                    })),
                    skipDuplicates: true,
                }),

                // Create or update the balances
                ...balances
                    .filter((share) => share.balanceNum > 0)
                    .map((dbEntry) => {
                        const { id, chain, ...data } = dbEntry;

                        return prisma.prismaUserStakedBalance.upsert({
                            where: {
                                id_chain: {
                                    id,
                                    chain,
                                },
                            },
                            update: data,
                            create: dbEntry,
                        });
                    }),

                // Max 32767 IDs per deleteMany call that DB can handle
                ..._.chunk(obsoleteIDs, 32000).map((ids) =>
                    prisma.prismaUserStakedBalance.deleteMany({
                        where: {
                            id: { in: ids },
                            chain,
                        },
                    }),
                ),

                prisma.prismaLastBlockSynced.upsert({
                    where: {
                        category_chain: {
                            category: 'GAUGE_BALANCES',
                            chain,
                        },
                    },
                    create: {
                        chain,
                        category: 'GAUGE_BALANCES',
                        blockNumber,
                    },
                    update: {
                        blockNumber,
                    },
                }),
            ],
            true,
        );
    }

    public async syncChangedStakedBalances(chain: Chain): Promise<void> {
        this.initStakedBalances(['GAUGE'], chain);
    }

    public async syncUserBalance({ userAddress, poolId, chain, poolAddress, staking }: UserSyncUserBalanceInput) {
        const client = getViemClient(staking.chain);
        const balance = (await client.readContract({
            address: staking.address as `0x{string}`,
            abi: RewardsOnlyGaugeAbi,
            functionName: 'balanceOf',
            args: [userAddress],
        })) as bigint;
        const amount = formatFixed(balance, 18);

        if (amount != '0') {
            await prisma.prismaUserStakedBalance.upsert({
                where: { id_chain: { id: `${staking.address}-${userAddress}`, chain } },
                update: {
                    balance: amount,
                    balanceNum: parseFloat(amount),
                },
                create: {
                    id: `${staking.address}-${userAddress}`,
                    chain,
                    balance: amount,
                    balanceNum: parseFloat(amount),
                    userAddress: userAddress,
                    poolId: poolId,
                    tokenAddress: poolAddress,
                    stakingId: staking.address,
                },
            });
        } else {
            await prisma.prismaUserStakedBalance.deleteMany({
                where: {
                    id: `${staking.address}-${userAddress}`,
                    chain,
                },
            });
        }
    }
}
