// import { blocksSubgraphService } from '../../../modules/subgraphs/blocks-subgraph/blocks-subgraph.service';
// import { balancerSubgraphService } from '../../../modules/subgraphs/balancer-subgraph/balancer-subgraph.service';
// import { masterchefService } from '../../../modules/subgraphs/masterchef-subgraph/masterchef.service';
// import { beetsBarService } from '../../../modules/subgraphs/beets-bar-subgraph/beets-bar.service';
// import { prisma } from '../../../prisma/prisma-client';
// import _, { parseInt } from 'lodash';
// import { BlockFragment } from '../../../modules/subgraphs/blocks-subgraph/generated/blocks-subgraph-types';
// import {
//     BalancerPoolFragment,
//     BalancerUserFragment,
// } from '../../../modules/subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
// import {
//     FarmFragment,
//     FarmUserFragment,
// } from '../../../modules/subgraphs/masterchef-subgraph/generated/masterchef-subgraph-types';
// import {
//     BeetsBarFragment,
//     BeetsBarUserFragment,
// } from '../../../modules/subgraphs/beets-bar-subgraph/generated/beets-bar-subgraph-types';
// import { PrismaBalancerPoolSnapshotWithTokens, PrismaBlockExtended, UserPortfolioData } from '../portfolio-types';
// import { PrismaBalancerPool } from '@prisma/client';
// import { cache } from '../../../modules/cache/cache';
// import { oneDayInMinutes } from '../../../modules/common/time';
// //import { balancerService } from '../../balancer/balancer.service';
//
// const LAST_BLOCK_CACHED_KEY = 'portfolio:data:last-block-cached';
// const HISTORY_CACHE_KEY_PREFIX = 'portfolio:data:history:';
//
// interface PortfolioDataNow {
//     pools: PrismaBalancerPool[];
//     block: PrismaBlockExtended;
//     previousBlock: PrismaBlockExtended;
// }
//
// export class PortfolioDataService {
//     public async getPortfolioDataForNow(userAddress: string): Promise<PortfolioDataNow | null> {
//         const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
//         const { user, previousUser } = await balancerSubgraphService.getPortfolioData(
//             userAddress,
//             parseInt(previousBlock.number),
//         );
//
//         if (!user) {
//             return null;
//         }
//
//         //const cachedPools = await balancerService.getPools();
//         const cachedPools: any[] = []; //TODO: fix
//         const { pools: subgraphPools, previousPools: subgraphPreviousPools } =
//             await balancerSubgraphService.getPortfolioPoolsData(parseInt(previousBlock.number));
//
//         const pools = this.injectTokenPriceRates(subgraphPools, cachedPools);
//         const previousPools = this.injectTokenPriceRates(subgraphPreviousPools, cachedPools);
//
//         const { farmUsers, previousFarmUsers } = await masterchefService.getPortfolioData({
//             address: userAddress,
//             previousBlockNumber: parseInt(previousBlock.number),
//         });
//         const { beetsBarUser, previousBeetsBarUser, beetsBar, previousBeetsBar } =
//             await beetsBarService.getPortfolioData(userAddress, parseInt(previousBlock.number));
//
//         const response = {
//             pools: pools.map((pool) => ({
//                 ...pool,
//                 symbol: pool.symbol ?? '',
//                 name: pool.name ?? '',
//                 owner: pool.owner ?? '',
//             })),
//             block: this.mapSubgraphDataToExtendedBlock(
//                 userAddress,
//                 { number: '0', timestamp: '0', id: '' }, //not important
//                 user,
//                 pools,
//                 farmUsers,
//                 beetsBar,
//                 beetsBarUser,
//             ),
//             previousBlock: this.mapSubgraphDataToExtendedBlock(
//                 userAddress,
//                 previousBlock,
//                 previousUser ?? user,
//                 previousPools,
//                 previousFarmUsers,
//                 previousBeetsBar,
//                 previousBeetsBarUser,
//             ),
//         };
//
//         return response;
//     }
//
//     public mapSubgraphDataToExtendedBlock(
//         userAddress: string,
//         block: BlockFragment,
//         user: BalancerUserFragment,
//         pools: BalancerPoolFragment[],
//         farmUsers: FarmUserFragment[],
//         beetsBar: BeetsBarFragment,
//         beetsBarUser: BeetsBarUserFragment | null,
//     ): PrismaBlockExtended {
//         const blockNumber = parseInt(block.number);
//         const poolShares = [];
//
//         const poolIds: string[] = [];
//         const poolAddresses: string[] = [];
//
//         for (const farm of farmUsers) {
//             if (farm.pool) {
//                 poolAddresses.push(farm.pool.pair);
//             }
//         }
//         for (const sharesOwned of user.sharesOwned ?? []) {
//             poolIds.push(sharesOwned.poolId.id);
//         }
//
//         for (const pool of pools) {
//             if (poolAddresses.includes(pool.address) || poolIds.includes(pool.id)) {
//                 const poolSnapshot: PrismaBalancerPoolSnapshotWithTokens = {
//                     ...pool,
//                     poolId: pool.id,
//                     amp: pool.amp ?? null,
//                     blockNumber,
//                     tokens: this.getPoolTokens(pool, pools).map((token) => ({
//                         ...token,
//                         snapshotId: '',
//                         poolId: pool.id,
//                         blockNumber,
//                         token: {
//                             ...token,
//                             decimals: token.decimals,
//                             logoURI: null,
//                             coingeckoContractAddress: null,
//                             coingeckoPlatformId: null,
//                             coingeckoTokenId: null,
//                             priority: 0,
//                         },
//                     })),
//                 };
//
//                 const sharesOwned = {
//                     balance: '0', // not used. always 0
//                     id: `${pool.address}-${userAddress}`,
//                     poolId: {
//                         id: pool.id,
//                     },
//                 };
//
//                 poolShares.push({
//                     ...sharesOwned,
//                     userAddress,
//                     blockNumber,
//                     poolId: sharesOwned.poolId.id,
//                     poolSnapshotId: '',
//                     poolSnapshot,
//                 });
//             }
//         }
//
//         return {
//             id: block.id,
//             number: blockNumber,
//             timestamp: parseInt(block.timestamp),
//             poolShares,
//             farmUsers: farmUsers.map((farmUser) => ({
//                 ...farmUser,
//                 blockNumber,
//                 farmUserId: '',
//                 farmId: '',
//                 userAddress,
//                 farm: {
//                     id: '',
//                     poolId: pools.find((pool) => pool.address === farmUser.pool?.pair)?.id ?? null,
//                     pair: farmUser.pool?.pair || '',
//                 },
//             })),
//             beetsBar: { ...beetsBar, blockNumber },
//             beetsBarUsers: beetsBarUser ? [{ ...beetsBarUser, blockNumber }] : [],
//         };
//     }
//
//     public async cacheRawDataForTimestamp(timestamp: number): Promise<void> {
//         try {
//             console.log(`portfolio cache <${timestamp}>: fetching data`);
//             const block = await blocksSubgraphService.getBlockForTimestamp(timestamp);
//             const blockNumber = parseInt(block.number);
//             const users = await balancerSubgraphService.getAllUsers({ block: { number: blockNumber } });
//             const farms = await masterchefService.getAllFarms({ block: { number: blockNumber } });
//             const farmUsers = await masterchefService.getAllFarmUsers({ block: { number: blockNumber } });
//             const pools = await balancerSubgraphService.getAllPoolsAtBlock(blockNumber);
//             const beetsBar = await beetsBarService.getBeetsBar(blockNumber);
//             const beetsBarUsers = await beetsBarService.getAllUsers({ block: { number: blockNumber } });
//             console.log(`portfolio cache <${timestamp}>: done fetching data`);
//
//             console.log(`portfolio cache <${timestamp}>: deleting snapshots`);
//             await this.deleteSnapshotsForBlock(blockNumber);
//             console.log(`portfolio cache <${timestamp}>: saving block`);
//             await this.saveBlock(block, timestamp);
//             console.log(`portfolio cache <${timestamp}>: saving new pools`);
//             await this.saveAnyNewPools(pools);
//             console.log(`portfolio cache <${timestamp}>: saving new users`);
//             await this.saveAnyNewUsers(users, farmUsers, beetsBarUsers);
//             console.log(`portfolio cache <${timestamp}>: saving new tokens`);
//             await this.saveAnyNewTokens(pools);
//
//             console.log(`portfolio cache <${timestamp}>: saving pool  snapshots`);
//             await this.savePoolSnapshots(blockNumber, pools, users);
//             console.log(`portfolio cache <${timestamp}>: saving farms`);
//             await this.saveFarms(blockNumber, farms, farmUsers);
//             console.log(`portfolio cache <${timestamp}>: saving beets bar`);
//             await this.saveBeetsBar(blockNumber, beetsBar, beetsBarUsers);
//
//             console.log(`portfolio cache <${timestamp}>: saving latest block`);
//             await this.refreshLatestBlockCachedTimestamp();
//             console.log(`portfolio cache <${timestamp}>: done`);
//         } catch (e) {
//             console.log(`error <${timestamp}>`, e);
//             throw e;
//         }
//     }
//
//     public async getCachedPortfolioHistory(address: string): Promise<UserPortfolioData[] | null> {
//         const timestamp = await cache.getValue(LAST_BLOCK_CACHED_KEY);
//
//         if (!timestamp) {
//             return null;
//         }
//
//         return cache.getObjectValue<UserPortfolioData[]>(`${HISTORY_CACHE_KEY_PREFIX}${timestamp}:${address}`);
//     }
//
//     public async cachePortfolioHistory(address: string, timestamp: number, data: UserPortfolioData[]): Promise<void> {
//         await cache.putObjectValue<UserPortfolioData[]>(
//             `${HISTORY_CACHE_KEY_PREFIX}${timestamp}:${address}`,
//             data,
//             oneDayInMinutes,
//         );
//     }
//
//     public async refreshLatestBlockCachedTimestamp(): Promise<void> {
//         const latestBlock = await prisma.prismaBlock.findFirst({ orderBy: { timestamp: 'desc' } });
//
//         if (latestBlock) {
//             await cache.putValue(LAST_BLOCK_CACHED_KEY, `${latestBlock.timestamp}`);
//         }
//     }
//
//     private async deleteSnapshotsForBlock(blockNumber: number) {
//         await prisma.prismaBalancerPoolTokenSnapshot.deleteMany({ where: { blockNumber } });
//         await prisma.prismaBalancerPoolShareSnapshot.deleteMany({ where: { blockNumber } });
//         await prisma.prismaBalancerPoolSnapshot.deleteMany({ where: { blockNumber } });
//
//         await prisma.prismaFarmUserSnapshot.deleteMany({ where: { blockNumber } });
//
//         await prisma.prismaBeetsBarSnapshot.deleteMany({ where: { blockNumber } });
//         await prisma.prismaBeetsBarUserSnapshot.deleteMany({ where: { blockNumber } });
//     }
//
//     private async saveBlock(block: BlockFragment, timestamp: number) {
//         await prisma.prismaBlock.createMany({
//             data: [
//                 {
//                     number: parseInt(block.number),
//                     id: block.id,
//                     timestamp,
//                 },
//             ],
//             skipDuplicates: true,
//         });
//     }
//
//     private async saveAnyNewPools(pools: BalancerPoolFragment[]) {
//         await prisma.prismaBalancerPool.createMany({
//             data: pools.map((pool) => ({
//                 id: pool.id,
//                 address: pool.address,
//                 symbol: pool.symbol ?? '',
//                 name: pool.name ?? '',
//             })),
//             skipDuplicates: true,
//         });
//     }
//
//     private async saveAnyNewUsers(
//         users: BalancerUserFragment[],
//         farmUsers: FarmUserFragment[],
//         beetsBarUsers: BeetsBarUserFragment[],
//     ) {
//         const userAddresses = _.uniq([
//             ...users.map((user) => user.id),
//             ...farmUsers.map((farmUser) => farmUser.address),
//             ...beetsBarUsers.map((beetsBarUser) => beetsBarUser.address),
//         ]);
//
//         await prisma.prismaUser.createMany({
//             data: userAddresses.map((address) => ({ address })),
//             skipDuplicates: true,
//         });
//     }
//
//     private async saveAnyNewTokens(pools: BalancerPoolFragment[]) {
//         const tokens = _.uniq(_.flatten(pools.map((pool) => this.getPoolTokens(pool, pools))));
//
//         for (const token of tokens) {
//             await prisma.prismaToken.upsert({
//                 where: { address: token.address },
//                 update: { name: token.name, symbol: token.symbol },
//                 create: {
//                     address: token.address,
//                     name: token.name,
//                     symbol: token.symbol,
//                     decimals: token.decimals,
//                 },
//             });
//         }
//     }
//
//     private async savePoolSnapshots(blockNumber: number, pools: BalancerPoolFragment[], users: BalancerUserFragment[]) {
//         const shares = _.flatten(
//             users.map((user) =>
//                 (user.sharesOwned || []).map((share) => ({
//                     userAddress: user.id,
//                     blockNumber,
//                     poolId: share.poolId.id,
//                     balance: share.balance || '0',
//                 })),
//             ),
//         );
//
//         for (const pool of pools) {
//             await prisma.prismaBalancerPoolSnapshot.create({
//                 data: {
//                     id: `${pool.id}-${blockNumber}`,
//                     poolId: pool.id,
//                     blockNumber,
//                     swapFee: pool.swapFee,
//                     totalSwapVolume: pool.totalSwapVolume,
//                     totalSwapFee: pool.totalSwapFee,
//                     totalLiquidity: pool.totalLiquidity,
//                     totalShares: pool.totalShares,
//                     swapsCount: pool.swapsCount,
//                     holdersCount: pool.holdersCount,
//                     swapEnabled: pool.swapEnabled,
//                     amp: pool.amp,
//                     tokens: {
//                         createMany: {
//                             data: this.getPoolTokens(pool, pools).map((token) => ({
//                                 address: token.address,
//                                 balance: token.balance,
//                                 invested: token.invested,
//                                 poolId: pool.id,
//                                 blockNumber,
//                             })),
//                         },
//                     },
//                     shares: {
//                         createMany: {
//                             data: shares.filter((share) => share.poolId === pool.id),
//                         },
//                     },
//                 },
//             });
//         }
//     }
//
//     private async saveFarms(blockNumber: number, farms: FarmFragment[], farmUsers: FarmUserFragment[]) {
//         await prisma.prismaFarm.createMany({
//             data: farms.map((farm) => ({
//                 id: farm.id,
//                 pair: farm.pair,
//             })),
//             skipDuplicates: true,
//         });
//
//         await prisma.prismaFarmUser.createMany({
//             data: farmUsers
//                 .filter((farmUser) => farmUser.pool)
//                 .map((farmUser) => ({
//                     id: farmUser.id,
//                     userAddress: farmUser.address,
//                     farmId: farmUser.pool!.id,
//                 })),
//             skipDuplicates: true,
//         });
//
//         await prisma.prismaFarmUserSnapshot.createMany({
//             data: farmUsers
//                 .filter((farmUser) => farmUser.pool)
//                 .map((farmUser) => ({
//                     userAddress: farmUser.address,
//                     blockNumber,
//                     farmUserId: farmUser.id,
//                     farmId: farmUser.pool!.id,
//                     amount: farmUser.amount,
//                     rewardDebt: farmUser.rewardDebt,
//                     beetsHarvested: farmUser.beetsHarvested,
//                 })),
//         });
//     }
//
//     private async saveBeetsBar(blockNumber: number, beetsBar: BeetsBarFragment, beetsBarUsers: BeetsBarUserFragment[]) {
//         await prisma.prismaBeetsBarSnapshot.create({
//             data: {
//                 blockNumber,
//                 fBeetsBurned: beetsBar.fBeetsBurned,
//                 fBeetsMinted: beetsBar.fBeetsMinted,
//                 ratio: beetsBar.ratio,
//                 totalSupply: beetsBar.totalSupply,
//                 vestingTokenStaked: beetsBar.vestingTokenStaked,
//                 sharedVestingTokenRevenue: beetsBar.sharedVestingTokenRevenue,
//             },
//         });
//
//         await prisma.prismaBeetsBarUserSnapshot.createMany({
//             data: beetsBarUsers.map((beetsBarUser) => ({
//                 address: beetsBarUser.address,
//                 fBeets: beetsBarUser.fBeets,
//                 vestingTokenHarvested: beetsBarUser.vestingTokenHarvested,
//                 vestingTokenIn: beetsBarUser.vestingTokenIn,
//                 vestingTokenOut: beetsBarUser.vestingTokenOut,
//                 blockNumber,
//             })),
//         });
//     }
//
//     private getPoolTokens(pool: BalancerPoolFragment, allPools: BalancerPoolFragment[]) {
//         const tokens = pool.tokens ?? [];
//
//         return tokens
//             .filter((token) => token.address !== pool.address)
//             .map((token) => {
//                 const nestedPool = allPools.find((p) => token.address === p.address);
//
//                 if (nestedPool && nestedPool.poolType === 'Linear' && nestedPool.tokens) {
//                     const nestedPoolTokens = nestedPool.tokens ?? [];
//                     const mainToken = nestedPoolTokens[nestedPool.mainIndex || 0];
//                     const wrappedToken = nestedPoolTokens[nestedPool.wrappedIndex || 0];
//
//                     return {
//                         ...mainToken,
//                         balance: `${
//                             parseFloat(mainToken.balance) +
//                             parseFloat(wrappedToken.balance) * parseFloat(wrappedToken.priceRate)
//                         }`,
//                     };
//                 }
//
//                 return token;
//             });
//     }
//
//     private injectTokenPriceRates(pools: BalancerPoolFragment[], poolsWithOnchainData: any[]) {
//         const onChainTokens = _.keyBy(_.flatten(poolsWithOnchainData.map((pool) => pool.tokens)), 'address');
//
//         return pools.map((pool) => {
//             return {
//                 ...pool,
//                 tokens: (pool.tokens || []).map((token) => {
//                     return {
//                         ...token,
//                         priceRate: onChainTokens[token.address]?.priceRate || token.priceRate,
//                     };
//                 }),
//             };
//         });
//     }
// }
