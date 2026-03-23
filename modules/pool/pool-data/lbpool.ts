import { VaultPoolFragment } from '../../sources/subgraphs/balancer-v3-vault/generated/types';
import { TypePoolFragment } from '../../sources/subgraphs/balancer-v3-pools/generated/types';
import { formatEther } from 'viem';

export type LBPoolData = {
    startTime: number;
    endTime: number;
    lbpOwner: string;
    isProjectTokenSwapInBlocked: boolean;
    projectToken: string;
    projectTokenIndex: number;
    projectTokenStartWeight: number;
    projectTokenEndWeight: number;
    reserveToken: string;
    reserveTokenIndex: number;
    reserveTokenStartWeight: number;
    reserveTokenEndWeight: number;
    reserveTokenVirtualBalance: number;
    initialReserveTokenVirtualBalance?: string;
    isSeedless: boolean;
};

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
        reserveTokenVirtualBalance: Number(formatEther(BigInt(params.reserveTokenVirtualBalance))),
        isSeedless: Number(formatEther(BigInt(params.reserveTokenVirtualBalance))) > 0,
    };
};
