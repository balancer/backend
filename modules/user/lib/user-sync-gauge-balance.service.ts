import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import RewardsOnlyGaugeAbi from './abi/RewardsOnlyGauge.json';
import { formatFixed } from '@ethersproject/bignumber';
import { Chain, PrismaPoolStakingType } from '@prisma/client';
import ERC20Abi from '../../web3/abi/ERC20.json';
import { formatEther, parseAbi, zeroAddress } from 'viem';
import { getEvents } from '../../web3/events';
import { GaugeSubgraphService } from '../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { BALANCES_SYNC_BLOCKS_MARGIN } from '../../../config';
import { getViemClient, ViemClient } from '../../sources/viem-client';
import config from '../../../config';
import { getLastSyncedBlock } from '../../actions/last-synced-block';
import { multicallViem } from '../../web3/multicaller-viem';

export class UserSyncGaugeBalanceService implements UserStakedBalanceService {
    constructor() {}

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void> {
        if (!stakingTypes.includes('GAUGE')) {
            return;
        }

        const { balances, blockNumber } = await this.balancesFromSG(chain);
        return this.saveBalances(balances, blockNumber);
    }

    public async syncChangedStakedBalances(chain: Chain): Promise<void> {
        // Check if RPC needs to be used
        const acceptableSGLag = config[chain].acceptableSGLag ?? 0;
        const client = getViemClient(chain);
        const latestBlock = await client.getBlockNumber().then(Number);
        const gaugeSubgraphService = new GaugeSubgraphService(config[chain].subgraphs.gauge!);
        const sgBlock = await gaugeSubgraphService.lastSyncedBlock();
        const lastSyncedBlock = await getLastSyncedBlock(chain, 'GAUGE_BALANCES');
        const { balances, blockNumber } =
            latestBlock - sgBlock > acceptableSGLag
                ? await this.balancesFromRPC(chain, client, lastSyncedBlock)
                : await this.balancesFromSG(chain, lastSyncedBlock);
        return this.saveBalances(balances, blockNumber);
    }

    private async balancesFromSG(chain: Chain, lastSyncedBlock?: number) {
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

        return { balances, blockNumber };
    }

    private async balancesFromRPC(chain: Chain, client: ViemClient, lastSyncedBlock: number) {
        const toBlock = await client.getBlockNumber().then(Number);

        const gauges = await prisma.prismaPoolStaking.findMany({
            select: { address: true, poolId: true },
            where: { type: 'GAUGE' },
        });

        const gaugeToPoolMap = Object.fromEntries(gauges.map((gauge) => [gauge.address, gauge.poolId]));
        const gaugeAddresses = Object.keys(gaugeToPoolMap);

        console.log(`[GaugeBalancesSync] ${chain} RPC search from ${lastSyncedBlock} to ${toBlock}`);

        // Get the events
        const events = await getEvents(
            lastSyncedBlock,
            toBlock,
            gaugeAddresses,
            ['Transfer'],
            config[chain].rpcUrl,
            config[chain].rpcMaxBlockRange,
            ERC20Abi,
        );

        const balancesToFetch = _.uniqBy(
            events
                .filter((event) => gaugeAddresses.includes(event.address.toLowerCase()))
                .flatMap((event) => [
                    { gaugeAddress: event.address, userAddress: event.args?.from as string },
                    { gaugeAddress: event.address, userAddress: event.args?.to as string },
                ])
                .filter((entry) => entry.userAddress !== zeroAddress),
            (entry) => entry.gaugeAddress + entry.userAddress,
        );

        console.log(`[GaugeBalancesSync] RPC found ${events.length} events for ${balancesToFetch.length} gauges`);

        const results = await multicallViem(
            client,
            balancesToFetch.map((entry) => ({
                path: entry.gaugeAddress + '-' + entry.userAddress,
                abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
                address: entry.gaugeAddress as `0x${string}`,
                functionName: 'balanceOf',
                args: [entry.userAddress as `0x${string}`],
            })),
        );

        const balances = Object.keys(results).map((id) => {
            const [gaugeAddress, userAddress] = id.toLowerCase().split('-');
            const poolId = gaugeToPoolMap[gaugeAddress];
            const poolAddress = poolId.substring(0, 42);
            const balance = formatEther(results[id]);

            return {
                id: id.toLowerCase(),
                poolId,
                chain,
                balance,
                balanceNum: parseFloat(balance),
                tokenAddress: poolAddress,
                userAddress,
                stakingId: gaugeAddress,
            };
        });

        return { balances, blockNumber: toBlock };
    }

    private saveBalances(
        balances: {
            id: string;
            chain: Chain;
            balance: string;
            balanceNum: number;
            userAddress: string;
            poolId: string;
            tokenAddress: string;
            stakingId: string;
        }[],
        blockNumber: number,
    ) {
        if (balances.length === 0) {
            return;
        }

        const obsoleteIDs = balances.filter((share) => share.balanceNum === 0).map(({ id }) => id);
        const userAddresses = _.uniq(balances.map((share) => share.userAddress)).map((userAddress) => ({
            address: userAddress,
        }));
        const chain = balances[0].chain;

        return prismaBulkExecuteOperations(
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
                        chain: share.chain,
                        type: 'GAUGE',
                    })),
                    skipDuplicates: true,
                }),

                prisma.prismaPoolStakingGauge.createMany({
                    data: balances.map((share) => ({
                        id: share.stakingId,
                        gaugeAddress: share.stakingId,
                        stakingId: share.stakingId,
                        chain: share.chain,
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
