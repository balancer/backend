import { prisma } from '../../prisma/prisma-client';

import { chunk, keyBy } from 'lodash';
import { VotingGauge, VotingGaugesRepository } from './voting-gauges.repository';
import { oldVeBalAddress, specialVotingGaugeAddresses } from './special-pools/special-voting-gauge-addresses';
import { getVeVotingGauges, veGauges, vePools } from './special-pools/ve-pools';
import { hardCodedPools } from './special-pools/hardcoded-pools';
import { GqlVotingPool } from '../../apps/api/gql/generated-schema';
import { $Enums, Chain } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

export class VeBalVotingListService {
    constructor(private votingGauges = new VotingGaugesRepository()) {}

    /*
        This methods is used by veBalGetVotingList resolver that is consumed by some partners
        We should avoid breaking changes in the involved schema
    */
    public async getVotingListWithHardcodedPools(includeKilled?: boolean): Promise<GqlVotingPool[]> {
        return [...(await this.getVotingList(includeKilled)), ...hardCodedPools];
    }

    public async getVotingList(includeKilled?: boolean): Promise<GqlVotingPool[]> {
        const validGauges = await this.getValidVotingGauges(includeKilled);
        const validVotingGaugesByPoolId = keyBy(validGauges, (gauge) => gauge.stakingGauge!.staking.poolId);

        let poolIds = Object.keys(validVotingGaugesByPoolId);

        poolIds = [...poolIds, ...Object.keys(vePools)];

        const pools = await this.getPoolsForVotingList(poolIds);
        const poolsById = keyBy(pools, 'id');

        const allGauges = [...validGauges, ...(await getVeVotingGauges())];

        // For each voting gauge returns a pool with its gauge info inside
        return allGauges.map((votingGauge) => {
            const pool = poolsById[votingGauge.stakingGauge!.staking.poolId];
            // Only L2 networks have childGaugeAddress
            const childGaugeAddress = pool.chain === Chain.MAINNET ? null : votingGauge.stakingGauge?.staking.address;
            const votingPool = {
                id: pool.id,
                chain: pool.chain,
                symbol: pool.symbol,
                address: pool.address,
                type: pool.type,
                protocolVersion: pool.protocolVersion,
                tags: pool.categories,
                tokens: pool.tokens.map((token) => ({
                    address: token.address,
                    weight: token.weight,
                    symbol: token.token.symbol,
                    logoURI: token.token.logoURI || '',
                    underlyingTokenAddress: token.token.underlyingTokenAddress,
                })),
                poolTokens: pool.tokens.map((token) => mapPoolToken(token)),
                gauge: {
                    address: votingGauge.id,
                    relativeWeightCap: votingGauge.relativeWeightCap,
                    isKilled: votingGauge.status !== 'ACTIVE',
                    relativeWeight: votingGauge.relativeWeight || '0',
                    addedTimestamp: votingGauge.addedTimestamp,
                    childGaugeAddress,
                },
            };
            return votingPool;
        });
    }

    public async getPoolsForVotingList(poolIds: string[]) {
        let pools = await prisma.prismaPool.findMany({
            where: {
                id: { in: poolIds },
            },
            include: {
                tokens: {
                    orderBy: { index: 'asc' },
                    include: {
                        token: {
                            include: { types: true },
                        },
                        nestedPool: {
                            include: {
                                dynamicData: true,
                                tokens: {
                                    orderBy: { index: 'asc' },
                                    include: {
                                        token: {
                                            include: { types: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Remove BPT
        pools = pools.map((pool) => {
            pool.tokens = pool.tokens.filter((t) => t.address !== pool?.address);
            return pool;
        });
        return pools;
    }

    public async getValidVotingGauges(includeKilled?: boolean) {
        // A gauge should be included in the voting list when:
        //  - it is alive (not killed)
        //  - it is killed and has valid votes (the users should be able to reallocate votes)
        const gaugesWithStaking = await prisma.prismaVotingGauge.findMany({
            where: {
                stakingGaugeId: { not: null },
                ...(includeKilled ? {} : { OR: [{ status: 'ACTIVE' }, { relativeWeight: { not: '0' } }] }),
            },
            select: {
                id: true,
                chain: true,
                status: true,
                relativeWeightCap: true,
                relativeWeight: true,
                addedTimestamp: true,
                stakingGauge: {
                    select: {
                        staking: {
                            select: {
                                poolId: true,
                                address: true,
                            },
                        },
                    },
                },
            },
        });
        return gaugesWithStaking;
    }

    public async syncVotingGauges() {
        const onchainGaugeAddresses = await this.votingGauges.getVotingGaugeAddresses();

        return this.sync(onchainGaugeAddresses);
    }

    async sync(votingGaugeAddresses: string[]) {
        const chunks = chunk(votingGaugeAddresses, 50);

        const syncErrors: Error[] = [];
        for (const addressChunk of chunks) {
            const { filteredGauges, errors } = await this.fetchVotingGauges(addressChunk);
            syncErrors.push(...errors);
            /*
                We avoid saving gauges in specialVotingGaugeAddresses because they require special handling
            */
            const cleanVotingGauges = filteredGauges.filter(
                (gauge) => !specialVotingGaugeAddresses.includes(gauge.gaugeAddress),
            );

            const { saveErrors } = await this.votingGauges.saveVotingGauges(cleanVotingGauges);
            syncErrors.push(...saveErrors);
        }
        if (syncErrors.length > 0) {
            throw new Error(`Errors while syncing voting gauges: ${syncErrors.map((error) => error.message)}`);
        }
    }

    async fetchVotingGauges(votingGaugeAddresses: string[]) {
        const errors: Error[] = [];

        const subgraphGauges = await this.votingGauges.fetchVotingGaugesFromSubgraph(votingGaugeAddresses);

        const onchainGauges = await this.votingGauges.fetchOnchainVotingGauges(votingGaugeAddresses);

        const votingGauges = this.votingGauges.updateOnchainGaugesWithSubgraphData(onchainGauges, subgraphGauges);

        const gaugesWithMissingData = this.returnGaugesWithMissingData(votingGauges);

        const filteredGauges = votingGauges.filter(
            (gauge) => !gaugesWithMissingData.map((gauge) => gauge.gaugeAddress).includes(gauge.gaugeAddress),
        );

        if (gaugesWithMissingData.length > 0) {
            const errorMessage =
                'Detected active voting gauge/s with votes (relative weight > 0) that are not in subgraph: ' +
                JSON.stringify(gaugesWithMissingData);
            console.error(errorMessage);
            errors.push(new Error(errorMessage));
        }
        return { filteredGauges, errors };
    }

    returnGaugesWithMissingData(votingGauges: VotingGauge[]) {
        const gaugesWithMissingData = votingGauges
            .filter((gauge) => !veGauges.includes(gauge.gaugeAddress))
            .filter((gauge) => !gauge.isInSubgraph)
            .filter((gauge) => gauge.relativeWeight > 0)
            // Ignore old Vebal gauge address
            .filter((gauge) => gauge.gaugeAddress !== oldVeBalAddress);

        return gaugesWithMissingData;
    }
}

export const veBalVotingListService = new VeBalVotingListService();
function mapPoolToken(
    token: {
        token: {
            types: { id: string; chain: $Enums.Chain; type: $Enums.PrismaTokenTypeOption; tokenAddress: string }[];
        } & {
            symbol: string;
            chain: $Enums.Chain;
            address: string;
            name: string;
            decimals: number;
            description: string | null;
            logoURI: string | null;
            websiteUrl: string | null;
            discordUrl: string | null;
            telegramUrl: string | null;
            twitterUsername: string | null;
            priority: number;
            coingeckoPlatformId: string | null;
            coingeckoContractAddress: string | null;
            coingeckoTokenId: string | null;
            excludedFromCoingecko: boolean;
            underlyingTokenAddress: string | null;
            isBufferAllowed: boolean;
            unwrapRate: string;
        };
        nestedPool:
            | ({
                  tokens: ({
                      token: {
                          types: {
                              id: string;
                              chain: $Enums.Chain;
                              type: $Enums.PrismaTokenTypeOption;
                              tokenAddress: string;
                          }[];
                      } & {
                          symbol: string;
                          chain: $Enums.Chain;
                          address: string;
                          name: string;
                          decimals: number;
                          description: string | null;
                          logoURI: string | null;
                          websiteUrl: string | null;
                          discordUrl: string | null;
                          telegramUrl: string | null;
                          twitterUsername: string | null;
                          priority: number;
                          coingeckoPlatformId: string | null;
                          coingeckoContractAddress: string | null;
                          coingeckoTokenId: string | null;
                          excludedFromCoingecko: boolean;
                          underlyingTokenAddress: string | null;
                          isBufferAllowed: boolean;
                          unwrapRate: string;
                      };
                  } & {
                      id: string;
                      chain: $Enums.Chain;
                      poolId: string;
                      address: string;
                      index: number;
                      nestedPoolId: string | null;
                      priceRateProvider: string | null;
                      exemptFromProtocolYieldFee: boolean;
                      scalingFactor: string | null;
                      balance: string;
                      balanceUSD: number;
                      weight: string | null;
                      priceRate: string;
                      latestFxPrice: number | null;
                  })[];
                  dynamicData: {
                      id: string;
                      chain: $Enums.Chain;
                      poolId: string;
                      blockNumber: number;
                      totalLiquidity: number;
                      volume24h: number;
                      fees24h: number;
                      surplus24h: number;
                      totalShares: string;
                      totalSharesNum: number;
                      swapsCount: number;
                      holdersCount: number;
                      apr: number;
                      updatedAt: Date;
                      protocolYieldFee: string | null;
                      protocolSwapFee: string;
                      swapFee: string;
                      aggregateSwapFee: string;
                      aggregateYieldFee: string;
                      swapEnabled: boolean;
                      isPaused: boolean;
                      isInRecoveryMode: boolean;
                      yieldCapture24h: number;
                      protocolFees24h: number;
                      protocolYieldCapture24h: number;
                      volume48h: number;
                      fees48h: number;
                      surplus48h: number;
                      yieldCapture48h: number;
                      protocolFees48h: number;
                      protocolYieldCapture48h: number;
                      totalLiquidity24hAgo: number;
                      totalShares24hAgo: string;
                      lifetimeVolume: number;
                      lifetimeSwapFees: number;
                      sharePriceAth: number;
                      sharePriceAthTimestamp: number;
                      sharePriceAtl: number;
                      sharePriceAtlTimestamp: number;
                      totalLiquidityAth: number;
                      totalLiquidityAthTimestamp: number;
                      totalLiquidityAtl: number;
                      totalLiquidityAtlTimestamp: number;
                      volume24hAth: number;
                      volume24hAthTimestamp: number;
                      volume24hAtl: number;
                      volume24hAtlTimestamp: number;
                      fees24hAth: number;
                      fees24hAthTimestamp: number;
                      fees24hAtl: number;
                      fees24hAtlTimestamp: number;
                      tokenPairsData: JsonValue;
                  } | null;
              } & {
                  symbol: string;
                  id: string;
                  chain: $Enums.Chain;
                  version: number;
                  type: $Enums.PrismaPoolType;
                  address: string;
                  name: string;
                  createTime: number;
                  decimals: number;
                  pauseManager: string | null;
                  swapFeeManager: string;
                  poolCreator: string | null;
                  factory: string | null;
                  protocolVersion: number;
                  typeData: JsonValue;
                  liquidityManagement: JsonValue;
                  categories: string[];
                  hook: JsonValue | null;
              })
            | null;
    } & {
        id: string;
        chain: $Enums.Chain;
        poolId: string;
        address: string;
        index: number;
        nestedPoolId: string | null;
        priceRateProvider: string | null;
        exemptFromProtocolYieldFee: boolean;
        scalingFactor: string | null;
        balance: string;
        balanceUSD: number;
        weight: string | null;
        priceRate: string;
        latestFxPrice: number | null;
    },
): any {
    throw new Error('Function not implemented.');
}
