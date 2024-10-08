import { Multicaller3Viem } from '../../web3/multicaller-viem';
import { PrismaPoolType } from '@prisma/client';
import abi from '../abi/WeightedPoolV2.json';
import { Chain } from '@prisma/client';

interface PoolInput {
    id: string;
    chain: Chain;
    address: string;
    type: PrismaPoolType;
    version?: number;
}

interface OnchainState {
    pausedState?: [boolean, bigint, bigint];
    inRecoveryMode?: boolean;
}

const parse = (result: OnchainState) => ({
    isPaused: result.pausedState ? result.pausedState[0] : false,
    isInRecoveryMode: result.inRecoveryMode ? result.inRecoveryMode : false,
});

export const fetchOnChainPoolState = async (pools: PoolInput[], batchSize = 1024) => {
    if (pools.length === 0) {
        return {};
    }

    const multicaller = new Multicaller3Viem(pools[0].chain, abi, batchSize);

    pools.forEach(({ id, type, address }) => {
        // filter certain pool types that don't have pausedState or recovery mode
        if (type !== 'ELEMENT') {
            multicaller.call(`${id}.pausedState`, address, 'getPausedState');
        }
        if (
            type !== 'LIQUIDITY_BOOTSTRAPPING' && // exclude all LBP
            type !== 'META_STABLE' && // exclude meta stable
            type !== 'ELEMENT' // exclude element
        ) {
            multicaller.call(`${id}.inRecoveryMode`, address, 'inRecoveryMode');
        }
    });

    const results = (await multicaller.execute()) as {
        [id: string]: OnchainState;
    };

    const parsed = Object.fromEntries(Object.entries(results).map(([key, result]) => [key, parse(result)]));

    return parsed;
};
