import { Address, formatEther, formatUnits } from 'viem';
import SonicStaking from '../../sources/contracts/abis/SonicStaking';
import { ViemClient } from '../../sources/types';
import ConstantsManager from '../../sources/contracts/abis/ConstantsManager';
import SFC from '../../sources/contracts/abis/SFC';

export interface OnchainSonicStakingData {
    totalAssets: string;
    totalDelegated: string;
    totalPool: string;
    exchangeRate: string;
    protocolFee: string;
    apr: string;
}

export async function fetchSonicStakingData(
    stakingContractAddress: Address,
    constantsContractAddress: Address,
    sfcContractAddress: Address,
    client: ViemClient,
): Promise<OnchainSonicStakingData> {
    const stakingContractArgs = {
        address: stakingContractAddress,
        abi: SonicStaking,
    };

    const constantsContractArgs = {
        address: constantsContractAddress,
        abi: ConstantsManager,
    };

    const sfcContractArgs = {
        address: sfcContractAddress,
        abi: SFC,
    };

    const [totalAssets, totalDelegated, totalPool, exchangeRate, protocolFeeBIPS, totalStake, baseRewardPerSecond] =
        await client.multicall({
            contracts: [
                {
                    ...stakingContractArgs,
                    functionName: 'totalAssets',
                },
                {
                    ...stakingContractArgs,
                    functionName: 'totalDelegated',
                },
                {
                    ...stakingContractArgs,
                    functionName: 'totalPool',
                },
                {
                    ...stakingContractArgs,
                    functionName: 'getRate',
                },
                {
                    ...stakingContractArgs,
                    functionName: 'protocolFeeBIPS',
                },
                {
                    ...sfcContractArgs,
                    functionName: 'totalStake',
                },
                {
                    ...constantsContractArgs,
                    functionName: 'baseRewardPerSecond',
                },
            ],
            allowFailure: false,
            multicallAddress: '0xca11bde05977b3631167028862be2a173976ca11',
        });

    const baseRewardsPerSecondHuman = formatEther(baseRewardPerSecond);
    const rewardsPerDay = parseFloat(baseRewardsPerSecondHuman) * 86400;
    const totalStakeHuman = formatEther(totalStake);
    const aprFromOnchain = ((rewardsPerDay * 365) / parseFloat(totalStakeHuman)) * 100;

    const stakingData: OnchainSonicStakingData = {
        totalAssets: formatEther(totalAssets),
        totalDelegated: formatEther(totalDelegated),
        totalPool: formatEther(totalPool),
        exchangeRate: formatEther(exchangeRate),
        protocolFee: formatUnits(protocolFeeBIPS, 4),
        apr: `${aprFromOnchain}`,
    };

    return stakingData;
}
