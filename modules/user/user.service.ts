import { PrismaPoolStaking, PrismaPoolStakingType } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { GqlPoolJoinExit, GqlPoolSwap, GqlUserSnapshotDataRange } from '../../schema';
import { coingeckoService } from '../coingecko/coingecko.service';
import { isFantomNetwork, networkConfig } from '../config/network-config';
import { PoolSnapshotService } from '../pool/lib/pool-snapshot.service';
import { PoolSwapService } from '../pool/lib/pool-swap.service';
import { balancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { reliquarySubgraphService } from '../subgraphs/reliquary-subgraph/reliquary.service';
import { userSnapshotSubgraphService } from '../subgraphs/user-snapshot-subgraph/user-snapshot-subgraph.service';
import { tokenService } from '../token/token.service';
import { UserSyncMasterchefFarmBalanceService } from './lib/fantom/user-sync-masterchef-farm-balance.service';
import { UserSyncReliquaryFarmBalanceService } from './lib/fantom/user-sync-reliquary-farm-balance.service';
import { UserSyncGaugeBalanceService } from './lib/optimism/user-sync-gauge-balance.service';
import { UserBalanceService } from './lib/user-balance.service';
import { UserSnapshotService } from './lib/user-snapshot.service';
import { UserSyncWalletBalanceService } from './lib/user-sync-wallet-balance.service';
import { UserPoolBalance, UserPoolSnapshot, UserStakedBalanceService } from './user-types';

export class UserService {
    constructor(
        private readonly userBalanceService: UserBalanceService,
        private readonly walletSyncService: UserSyncWalletBalanceService,
        private readonly stakedSyncServices: UserStakedBalanceService[],
        private readonly poolSwapService: PoolSwapService,
        private readonly userSnapshotService: UserSnapshotService,
    ) {}

    public async getUserPoolBalances(address: string): Promise<UserPoolBalance[]> {
        return this.userBalanceService.getUserPoolBalances(address);
    }

    public async getUserPoolInvestments(
        address: string,
        poolId: string,
        first?: number,
        skip?: number,
    ): Promise<GqlPoolJoinExit[]> {
        return this.poolSwapService.getUserJoinExitsForPool(address, poolId, first, skip);
    }

    public async getUserSwaps(address: string, poolId: string, first?: number, skip?: number): Promise<GqlPoolSwap[]> {
        return this.poolSwapService.getUserSwapsForPool(address, poolId, first, skip);
    }

    public async getUserFbeetsBalance(address: string): Promise<Omit<UserPoolBalance, 'poolId'>> {
        return this.userBalanceService.getUserFbeetsBalance(address);
    }

    public async getUserStaking(address: string): Promise<PrismaPoolStaking[]> {
        return this.userBalanceService.getUserStaking(address);
    }

    public async getUserBalanceSnapshotsForPool(
        accountAddress: string,
        poolId: string,
        days: GqlUserSnapshotDataRange,
    ): Promise<UserPoolSnapshot[]> {
        return this.userSnapshotService.getUserPoolBalanceSnapshotsForPool(accountAddress, poolId, days);
    }

    public async getUserRelicSnapshots(accountAddress: string, farmId: string, days: GqlUserSnapshotDataRange) {
        return this.userSnapshotService.getUserRelicSnapshotsForFarm(accountAddress, farmId, days);
    }

    public async initWalletBalancesForAllPools() {
        await this.walletSyncService.initBalancesForPools();
    }

    public async initWalletBalancesForPool(poolId: string) {
        await this.walletSyncService.initBalancesForPool(poolId);
    }

    public async syncChangedWalletBalancesForAllPools() {
        await this.walletSyncService.syncChangedBalancesForAllPools();
    }

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[]) {
        await Promise.all(this.stakedSyncServices.map((service) => service.initStakedBalances(stakingTypes)));
    }

    public async syncChangedStakedBalances() {
        await Promise.all(this.stakedSyncServices.map((service) => service.syncChangedStakedBalances()));
    }

    public async syncUserBalanceAllPools(userAddress: string) {
        const allBalances = await this.userBalanceService.getUserPoolBalances(userAddress);
        for (const userPoolBalance of allBalances) {
            this.syncUserBalance(userAddress, userPoolBalance.poolId);
        }
    }

    public async syncUserBalance(userAddress: string, poolId: string) {
        const pool = await prisma.prismaPool.findUniqueOrThrow({
            where: { id: poolId },
            include: { staking: true },
        });

        // we make sure the user exists
        await prisma.prismaUser.upsert({
            where: { address: userAddress },
            update: {},
            create: { address: userAddress },
        });

        await this.walletSyncService.syncUserBalance(userAddress, pool.id, pool.address);

        if (pool.staking) {
            await Promise.all(
                this.stakedSyncServices.map((service) =>
                    service.syncUserBalance({
                        userAddress,
                        poolId: pool.id,
                        poolAddress: pool.address,
                        staking: pool.staking!,
                    }),
                ),
            );
        }
    }

    public async syncUserBalanceSnapshots() {
        await this.userSnapshotService.syncUserPoolBalanceSnapshots();
    }

    public async asyncSyncUserRelicSnapshots() {
        await this.userSnapshotService.syncLatestUserRelicSnapshots();
    }

    public async loadAllUserRelicSnapshots() {
        await this.userSnapshotService.loadAllUserRelicSnapshots();
    }
}

export const userService = new UserService(
    new UserBalanceService(networkConfig.fbeets?.address ?? ''),
    new UserSyncWalletBalanceService(networkConfig.balancer.vault),
    isFantomNetwork()
        ? [
              new UserSyncMasterchefFarmBalanceService(networkConfig.fbeets!.address, networkConfig.fbeets!.farmId),
              new UserSyncReliquaryFarmBalanceService(networkConfig.reliquary!.address),
          ]
        : [new UserSyncGaugeBalanceService()],
    new PoolSwapService(tokenService, balancerSubgraphService),
    new UserSnapshotService(
        userSnapshotSubgraphService,
        reliquarySubgraphService,
        new PoolSnapshotService(balancerSubgraphService, coingeckoService),
        networkConfig.fbeets?.address ?? '',
        networkConfig.fbeets?.poolId ?? '',
    ),
);
