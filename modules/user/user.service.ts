import { UserSyncWalletBalanceService } from './lib/user-sync-wallet-balance.service';
import { UserSyncMasterchefFarmBalanceService } from './lib/fantom/user-sync-masterchef-farm-balance.service';
import { UserPoolBalance, UserStakedBalanceService } from './user-types';
import { UserBalanceService } from './lib/user-balance.service';
import { PrismaPoolStaking } from '@prisma/client';
import { PoolSwapService } from '../pool/lib/pool-swap.service';
import { tokenService } from '../token/token.service';
import { balancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { GqlPoolJoinExit, GqlPoolSwap, GqlUserPoolSnapshot, QueryUserGetPoolSnapshotsArgs } from '../../schema';
import { isFantomNetwork } from '../config/network-config';
import { UserSyncGaugeBalanceService } from './lib/optimism/user-sync-gauge-balance.service';
import { prisma } from '../../prisma/prisma-client';
import { UserPoolSnapshot, UserSnapshotService } from './lib/user-snapshot.service';
import { userSnapshotSubgraphService } from '../subgraphs/user-snapshot-subgraph/user-snapshot-subgraph.service';

export class UserService {
    constructor(
        private readonly userBalanceService: UserBalanceService,
        private readonly walletSyncService: UserSyncWalletBalanceService,
        private readonly stakedSyncService: UserStakedBalanceService,
        private readonly poolSwapService: PoolSwapService,
        private readonly snapshotService: UserSnapshotService,
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

    public async initWalletBalancesForAllPools() {
        await this.walletSyncService.initBalancesForPools();
    }

    public async initWalletBalancesForPool(poolId: string) {
        await this.walletSyncService.initBalancesForPool(poolId);
    }

    public async syncWalletBalancesForAllPools() {
        await this.walletSyncService.syncBalancesForAllPools();
    }

    public async initStakedBalances() {
        await this.stakedSyncService.initStakedBalances();
    }

    public async syncStakedBalances() {
        await this.stakedSyncService.syncStakedBalances();
    }

    public async syncUserBalanceAllPools(userAddress: string) {
        const allBalances = await this.userBalanceService.getUserPoolBalances(userAddress);
        for (const userPoolBalance of allBalances) {
            this.syncUserBalance(userAddress, userPoolBalance.poolId);
        }
    }

    public async syncUserBalance(userAddress: string, poolId: string) {
        const pool = await prisma.prismaPool.findUnique({
            where: { id: poolId },
            include: { staking: true },
            rejectOnNotFound: true,
        });

        // we make sure the user exists
        await prisma.prismaUser.upsert({
            where: { address: userAddress },
            update: {},
            create: { address: userAddress },
        });

        const operations = [];
        operations.push(this.walletSyncService.syncUserBalance(userAddress, pool.id, pool.address));

        if (pool.staking) {
            operations.push(
                this.stakedSyncService.syncUserBalance({
                    userAddress,
                    poolId: pool.id,
                    poolAddress: pool.address,
                    staking: pool.staking,
                }),
            );
        }
        await Promise.all(operations);
    }

    public async getPoolSnapshots(
        args: QueryUserGetPoolSnapshotsArgs & { userAddress: string },
    ): Promise<UserPoolSnapshot[]> {
        return this.snapshotService.getPoolSnapshots(args);
    }
}

export const userService = new UserService(
    new UserBalanceService(),
    new UserSyncWalletBalanceService(),
    isFantomNetwork() ? new UserSyncMasterchefFarmBalanceService() : new UserSyncGaugeBalanceService(),
    new PoolSwapService(tokenService, balancerSubgraphService),
    new UserSnapshotService(userSnapshotSubgraphService),
);
