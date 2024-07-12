import { on } from 'events';
import { OnchainPoolData } from '../contracts/fetch-pool-data';
import { getViemClient } from '../viem-client';
import MinimalErc4626Abi from '../contracts/abis/MinimalERC4626';
import { Chain } from '@prisma/client';
import { ViemMulticallCall, multicallViem } from '../../web3/multicaller-viem';

interface CallData {
    asset: string;
    convertToAssets: BigInt;
    convertToShares: BigInt;
    previewDeposit: BigInt;
    previewMint: BigInt;
    previewRedeem: BigInt;
    previewWithdraw: BigInt;
}

export async function getErc4626Tokens(
    onchainData: { [address: string]: OnchainPoolData },
    chain: Chain,
): Promise<void>{

    const viemClient = getViemClient(chain);

    for (const pool in onchainData) {
        for (const token of onchainData[pool].tokens) {
            try{
                
            await viemClient.multicall({
                contracts: [
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'asset',
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'convertToAssets',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'convertToShares',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'previewDeposit',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'previewMint',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'previewRedeem',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'previewWithdraw',
                        args: [1n],
                    },
                ],
                allowFailure: false,
            });
        }catch(e){
            console.log(e); 
        }
    }

}
