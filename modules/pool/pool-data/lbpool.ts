import { VaultPoolFragment } from '../../sources/subgraphs/balancer-v3-vault/generated/types';
import { TypePoolFragment } from '../../sources/subgraphs/balancer-v3-pools/generated/types';
import { formatEther } from 'viem';

export type LBPoolData = ReturnType<typeof lbPool>;

export const lbPool = (pool: TypePoolFragment & VaultPoolFragment) => {
    const params = pool.lbpParams!;
    const tokens = pool.tokens;

    return {
        startTime: Number(params.startTime),
        endTime: Number(params.endTime),
        lbpOwner: params.owner.toLowerCase(),
        isProjectTokenSwapInBlocked: params.isProjectTokenSwapInBlocked,
        projectToken: params.projectToken.toLowerCase(),
        projectTokenIndex: tokens.find((token) => token.address === params.projectToken)!.index,
        projectTokenStartWeight: Number(formatEther(BigInt(params.projectTokenStartWeight))),
        projectTokenEndWeight: Number(formatEther(BigInt(params.projectTokenEndWeight))),
        reserveToken: params.reserveToken.toLowerCase(),
        reserveTokenIndex: tokens.find((token) => token.address === params.reserveToken)!.index,
        reserveTokenStartWeight: Number(formatEther(BigInt(params.reserveTokenStartWeight))),
        reserveTokenEndWeight: Number(formatEther(BigInt(params.reserveTokenEndWeight))),
    };
};
