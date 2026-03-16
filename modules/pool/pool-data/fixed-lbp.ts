import { VaultPoolFragment } from '../../sources/subgraphs/balancer-v3-vault/generated/types';
import { TypePoolFragment } from '../../sources/subgraphs/balancer-v3-pools/generated/types';
import { formatEther } from 'viem';

export type FixedLBPData = ReturnType<typeof fixedLBP>;

export const fixedLBP = (pool: TypePoolFragment & VaultPoolFragment) => {
    const params = pool.fixedLBPParams!;
    const tokens = pool.tokens;

    return {
        startTime: Number(params.startTime),
        endTime: Number(params.endTime),
        lbpOwner: params.owner.toLowerCase(),
        isProjectTokenSwapInBlocked: params.isProjectTokenSwapInBlocked,
        projectToken: params.projectToken.toLowerCase(),
        projectTokenRate: formatEther(BigInt(params.projectTokenRate)),
        projectTokenIndex: tokens.find((token) => token.address === params.projectToken)!.index,
        reserveToken: params.reserveToken.toLowerCase(),
        reserveTokenIndex: tokens.find((token) => token.address === params.reserveToken)!.index,
    };
};
