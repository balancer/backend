import { Multicaller3Viem } from '../../web3/multicaller-viem';
import { PrismaPoolType } from '@prisma/client';
import abi from '../abi/GyroConfig.json';
import { defaultAbiCoder } from '@ethersproject/abi';
import { formatBytes32String } from '@ethersproject/strings';
import { keccak256 } from '@ethersproject/solidity';
import { formatEther } from 'ethers/lib/utils';
import { Chain } from '@prisma/client';

interface PoolInput {
    id: string;
    chain: Chain;
    address: string;
    type: PrismaPoolType;
    version?: number;
}

interface OnchainGyroFees {
    eclpFee?: string;
    twoClpFee?: string;
    threeClpFee?: string;
    defaultFee?: string;
    pools?: {
        [id: string]: {
            poolFee?: string;
        };
    };
}

export const fetchOnChainGyroFees = async (pools: PoolInput[], gyroConfigAddress?: string, batchSize = 1024) => {
    if (pools.length === 0 || !gyroConfigAddress) {
        return {};
    }

    const gyroPools = pools.filter(({ type }) => type.includes('GYRO'));
    if (gyroPools.length === 0) {
        return {};
    }

    const multicaller = new Multicaller3Viem(pools[0].chain, abi, batchSize);

    const feeKey = formatBytes32String('PROTOCOL_SWAP_FEE_PERC');

    const eclpKey = keccak256(
        ['bytes'],
        [defaultAbiCoder.encode(['bytes32', 'bytes32'], [feeKey, formatBytes32String('ECLP')])],
    );

    const twoClpKey = keccak256(
        ['bytes'],
        [defaultAbiCoder.encode(['bytes32', 'bytes32'], [feeKey, formatBytes32String('2CLP')])],
    );

    const threeClpKey = keccak256(
        ['bytes'],
        [defaultAbiCoder.encode(['bytes32', 'bytes32'], [feeKey, formatBytes32String('3CLP')])],
    );

    multicaller.call('defaultFee', gyroConfigAddress, 'getUint', [feeKey]);
    multicaller.call('eclpFee', gyroConfigAddress, 'getUint', [eclpKey]);
    multicaller.call('twoClpFee', gyroConfigAddress, 'getUint', [twoClpKey]);
    multicaller.call('threeClpFee', gyroConfigAddress, 'getUint', [threeClpKey]);

    gyroPools.forEach(({ id, address }) => {
        const poolFeeKey = keccak256(['bytes'], [defaultAbiCoder.encode(['bytes32', 'uint256'], [feeKey, address])]);
        multicaller.call(`pools.${id}.poolFee`, gyroConfigAddress, 'getUint', [poolFeeKey]);
    });

    const results = (await multicaller.execute()) as OnchainGyroFees;
    const defaultFee = results.defaultFee ?? '0';
    const typeFee = {
        GYROE: results.eclpFee ?? defaultFee,
        GYRO: results.twoClpFee ?? defaultFee,
        GYRO3: results.threeClpFee ?? defaultFee,
    };

    const parsed = Object.fromEntries(
        gyroPools.map(({ id, type }) => {
            const fee = results.pools?.[id]?.poolFee ?? typeFee[type as keyof typeof typeFee] ?? defaultFee;
            return [id, formatEther(fee)];
        }),
    );

    return parsed;
};
