import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import _, { add } from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { formatFixed } from '@ethersproject/bignumber';
import { Chain, PrismaPoolStakingType } from '@prisma/client';
import ERC20Abi from '../../web3/abi/ERC20.json';
import { AuraSubgraphService } from '../../sources/subgraphs/aura/aura.service';
import { formatEther, hexToBigInt } from 'viem';
import { getViemClient } from '../../sources/viem-client';
import config from '../../../config';
import { AccountSchemaFragment } from '../../sources/subgraphs/aura/generated/aura-subgraph-types';

export class UserSyncAuraBalanceService implements UserStakedBalanceService {
    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void> {
        if (!stakingTypes.includes('AURA')) {
            return;
        }

        const viemClient = getViemClient(chain);
        const blockNumber = await viemClient.getBlockNumber();

        let accounts: AccountSchemaFragment[] = [];
        try {
            const auraSubgraphService = new AuraSubgraphService(config[chain].subgraphs.aura!);
            accounts = await auraSubgraphService.getAllUsers();
        } catch (e) {
            return;
        }

        // Get AURA pools - used to deal with staking ID DB constraint
        const stakings = await prisma.prismaPoolStaking.findMany({
            select: { id: true, poolId: true },
            where: { type: 'AURA', chain },
        });

        const dbBalances = await prisma.prismaUserStakedBalance.findMany({
            where: { chain: chain, stakingId: { in: stakings.map((staking) => staking.id) } },
        });

        const dbBalancesMap = _.keyBy(dbBalances, (dbBalance) => `${dbBalance.stakingId}-${dbBalance.userAddress}`);

        const operations: any[] = [];
        let i = 0;
        for (const account of accounts) {
            for (const poolAccount of account.poolAccounts) {
                if (poolAccount.pool.chainId === config[chain].chain.id) {
                    let staking = stakings.find((s) => s.id === poolAccount.pool.address);

                    // Add new staking
                    if (!staking) {
                        const pool = await prisma.prismaPool.findFirst({
                            where: { address: poolAccount.pool.lpToken.address, chain },
                        });
                        if (!pool) {
                            continue;
                        }
                        staking = await prisma.prismaPoolStaking.create({
                            data: {
                                id: poolAccount.pool.address,
                                chain,
                                type: 'AURA',
                                address: poolAccount.pool.address,
                                poolId: pool.id,
                            },
                        });
                        stakings.push(staking);
                    }
                    const poolId = staking.poolId;

                    const id = `${poolAccount.pool.address}-${account.id}`;
                    const currentBalance = dbBalancesMap[id];
                    const balance = formatEther(hexToBigInt(poolAccount.staked));

                    // Remove 0 balance staking
                    if (balance === '0') {
                        if (currentBalance) {
                            operations.push(
                                prisma.prismaUserStakedBalance.delete({ where: { id_chain: { id, chain } } }),
                            );
                        }
                        continue;
                    }

                    // Skip update if balance is the same
                    if (currentBalance && currentBalance.balance === balance) {
                        continue;
                    }

                    const data = {
                        id,
                        chain,
                        poolId,
                        balance,
                        balanceNum: parseFloat(balance),
                        userAddress: account.id,
                        tokenAddress: poolAccount.pool.lpToken.address,
                        stakingId: poolAccount.pool.address,
                    };

                    operations.push(
                        prisma.prismaUserStakedBalance.upsert({
                            where: { id_chain: { id, chain } },
                            create: data,
                            update: data,
                        }),
                    );
                }
            }
        }

        console.log(`[AuraBalanceSync] ${chain} AURA has ${operations.length} updates`);
        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: accounts.map((account) => ({ address: account.id })),
                    skipDuplicates: true,
                }),
                ...operations,
                prisma.prismaUserBalanceSyncStatus.upsert({
                    where: { type_chain: { type: 'AURA', chain: chain } },
                    create: { type: 'AURA', chain: chain, blockNumber: Number(blockNumber) },
                    update: { blockNumber: Number(blockNumber) },
                }),
            ],
            true,
        );
    }

    public async syncChangedStakedBalances(chain: Chain): Promise<void> {
        await this.initStakedBalances(['AURA'], chain);
    }

    public async syncUserBalance({ userAddress, poolId, chain, poolAddress, staking }: UserSyncUserBalanceInput) {
        const client = getViemClient(staking.chain);
        const balance = (await client.readContract({
            address: staking.address as `0x{string}`,
            abi: ERC20Abi,
            functionName: 'balanceOf',
            args: [userAddress],
        })) as bigint;
        const amount = formatFixed(balance, 18);

        await prisma.prismaUserStakedBalance.upsert({
            where: { id_chain: { id: `${staking.address}-${userAddress}`, chain: chain } },
            update: {
                balance: amount,
                balanceNum: parseFloat(amount),
            },
            create: {
                id: `${staking.address}-${userAddress}`,
                chain: chain,
                balance: amount,
                balanceNum: parseFloat(amount),
                userAddress: userAddress,
                poolId: poolId,
                tokenAddress: poolAddress,
                stakingId: staking.address,
            },
        });
    }
}
