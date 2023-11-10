import { Chain, PrismaPoolStaking, PrismaPoolStakingType } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { GqlPoolJoinExit, GqlPoolSwap, GqlUserSnapshotDataRange } from '../../schema';
import { coingeckoService } from '../coingecko/coingecko.service';
import { PoolSnapshotService } from '../pool/lib/pool-snapshot.service';
import { PoolSwapService } from '../pool/lib/pool-swap.service';
import { balancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { gaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { reliquarySubgraphService } from '../subgraphs/reliquary-subgraph/reliquary.service';
import { userSnapshotSubgraphService } from '../subgraphs/user-snapshot-subgraph/user-snapshot-subgraph.service';
import { tokenService } from '../token/token.service';
import { UserBalanceService } from './lib/user-balance.service';
import { UserSnapshotService } from './lib/user-snapshot.service';
import { UserSyncWalletBalanceService } from './lib/user-sync-wallet-balance.service';
import { UserPoolBalance, UserPoolSnapshot, UserStakedBalanceService } from './user-types';
import { networkContext } from '../network/network-context.service';

export class UserService {
    constructor(
        private readonly userBalanceService: UserBalanceService,
        private readonly walletSyncService: UserSyncWalletBalanceService,
        private readonly poolSwapService: PoolSwapService,
        private readonly userSnapshotService: UserSnapshotService,
    ) {}

    private get stakedSyncServices(): UserStakedBalanceService[] {
        return networkContext.config.userStakedBalanceServices;
    }

    public async getUserPoolBalances(address: string, chains: Chain[]): Promise<UserPoolBalance[]> {
        return this.userBalanceService.getUserPoolBalances(address, chains);
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
        const allBalances = await this.userBalanceService.getUserPoolBalances(userAddress, [networkContext.chain]);
        for (const userPoolBalance of allBalances) {
            await this.syncUserBalance(userAddress, userPoolBalance.poolId);
        }
    }

    public async syncUserBalance(userAddress: string, poolId: string) {
        const pool = await prisma.prismaPool.findUniqueOrThrow({
            where: { id_chain: { id: poolId, chain: networkContext.chain } },
            include: { staking: true },
        });

        // we make sure the user exists
        await prisma.prismaUser.upsert({
            where: { address: userAddress },
            update: {},
            create: { address: userAddress },
        });

        await this.walletSyncService.syncUserBalance(userAddress, pool.id, pool.address);

        for (const stake of pool.staking) {
            await Promise.all(
                this.stakedSyncServices.map((service) =>
                    service.syncUserBalance({
                        userAddress,
                        poolId: pool.id,
                        poolAddress: pool.address,
                        staking: stake,
                    }),
                ),
            );
        }
    }

    public async syncUserBalanceSnapshots() {
        await this.userSnapshotService.syncUserPoolBalanceSnapshots();
    }

    public async syncUserRelicSnapshots() {
        await this.userSnapshotService.syncLatestUserRelicSnapshots();
    }

    public async loadAllUserRelicSnapshots() {
        await this.userSnapshotService.loadAllUserRelicSnapshots();
    }
}

export const userService = new UserService(
    new UserBalanceService(),
    new UserSyncWalletBalanceService(),
    new PoolSwapService(tokenService, balancerSubgraphService),
    new UserSnapshotService(
        userSnapshotSubgraphService,
        reliquarySubgraphService,
        new PoolSnapshotService(balancerSubgraphService, coingeckoService),
    ),
);
