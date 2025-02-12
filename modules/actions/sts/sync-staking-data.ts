import { prisma } from '../../../prisma/prisma-client';
import { fetchSonicStakingData } from '../../sources/contracts/fetch-sts-staking-data';
import { StsSubgraphService } from '../../sources/subgraphs/sts-subgraph/sts.service';
import { Address, formatEther } from 'viem';
import { ViemClient } from '../../sources/viem-client';
import { blockNumbers } from '../../block-numbers';

interface SonicApiResponse {
    success: boolean;
    data: {
        apr: number;
    };
}

export async function syncStakingData(
    stakingContractAddress: Address,
    viemClient: ViemClient,
    subgraphService: StsSubgraphService,
    baseAprUrl: string,
    validatorFee: number,
) {
    const stakingDataOnchain = await fetchSonicStakingData(stakingContractAddress, viemClient);
    const validators = await subgraphService.getAllValidators();
    const latestStakingData = await subgraphService.getStakingData();
    const block24HrsAgo = await blockNumbers().getBlock('SONIC', Date.now() - 24 * 60 * 60 * 1000);
    const stakingData24hrsAgo = await subgraphService.getStakingData(block24HrsAgo);

    let protocolFee24hrs = 0;
    if (latestStakingData && stakingData24hrsAgo) {
        protocolFee24hrs =
            parseFloat(latestStakingData.totalProtocolFee) - parseFloat(stakingData24hrsAgo.totalProtocolFee);
    }

    const response = await fetch(baseAprUrl);
    const data = (await response.json()) as SonicApiResponse;
    if (!data.success) {
        throw new Error('Failed to fetch sonic staking APR');
    }

    const stakingApr =
        (parseFloat(stakingDataOnchain.totalDelegated) / parseFloat(stakingDataOnchain.totalAssets)) *
        ((data.data.apr / 100) * (1 - validatorFee)) *
        (1 - parseFloat(stakingDataOnchain.protocolFee));

    await prisma.prismaStakedSonicData.upsert({
        where: { id: stakingContractAddress },
        create: {
            id: stakingContractAddress,
            totalAssets: stakingDataOnchain.totalAssets,
            totalAssetsDelegated: stakingDataOnchain.totalDelegated,
            totalAssetsPool: stakingDataOnchain.totalPool,
            exchangeRate: stakingDataOnchain.exchangeRate,
            stakingApr: `${stakingApr}`,
            protocolFee24h: `${protocolFee24hrs}`,
        },
        update: {
            id: stakingContractAddress,
            totalAssets: stakingDataOnchain.totalAssets,
            totalAssetsDelegated: stakingDataOnchain.totalDelegated,
            totalAssetsPool: stakingDataOnchain.totalPool,
            exchangeRate: stakingDataOnchain.exchangeRate,
            stakingApr: `${stakingApr}`,
            protocolFee24h: `${protocolFee24hrs}`,
        },
    });

    for (const validator of validators) {
        await prisma.prismaStakedSonicDelegatedValidator.upsert({
            where: { validatorId: validator.id },
            create: {
                validatorId: validator.id,
                assetsDelegated: validator.amountAssetsDelegated,
                sonicStakingId: stakingContractAddress,
            },
            update: {
                validatorId: validator.id,
                assetsDelegated: validator.amountAssetsDelegated,
            },
        });
    }
}
