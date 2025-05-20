import axios from 'axios';
import { AprHandler } from '../types';
import { EulerAprConfig } from '../../../../../network/apr-config-types';
import { Chain } from '@prisma/client';
import { prisma } from '../../../../../../prisma/prisma-client';
import { multicallViem } from '../../../../../web3/multicaller-viem';
import eulerVault from './abis/euler-vault';
import { getViemClient } from '../../../../../sources/viem-client';
import eulerUtilsLens from './abis/euler-utils-lens';
import { Multicaller3Call } from '../../../../../web3/types';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { formatUnits } from 'viem';

type VaultsResponse = {
    [address: string]: {
        name: string;
    };
};

type ComputeAPYs = AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof eulerUtilsLens, 'computeAPYs'>['outputs']>;

export class EulerAprHandler implements AprHandler {
    /*
    best to query the computeAPYs function of the utils lens contract:
https://github.com/euler-xyz/evk-periphery/blob/af4a193813574715532dcd8cc5e55198820941cb/src/Lens/UtilsLens.sol#L18

you need to pass:
- the result of vault.interestRate() as borrowSPY
- the result of vault.cash() as cash
- the result of vault.totalBorrows() as borrows
- the result of vault.interestFee() as interestFee

you can find the addresses here, depending on the chain you're interested in: 
https://github.com/euler-xyz/euler-interfaces/tree/master/addresses

We should get all deployed vaults for chains of interest via vaultsBaseUrl
Check which vaults we have in pools via prisma query
for these vaults, get on chain data
for each results for the above query, compute apy via utilsLens contract
and return the result as apr
    */

    vaultsBaseUrl: string;
    lensContractAddress: string;

    constructor(aprHandlerConfig: EulerAprConfig) {
        this.vaultsBaseUrl = aprHandlerConfig.vaultsJsonUrl;
        this.lensContractAddress = aprHandlerConfig.lensContractAddress;
    }

    async getAprs(chain: Chain) {
        try {
            // find vaults that we have in our pools
            const vaults = await axios.get<VaultsResponse>(this.vaultsBaseUrl).then((response) => response.data);

            const vaultsAddresses = Object.keys(vaults).map((address) => address.toLowerCase());
            const pools = await prisma.prismaPool.findMany({
                where: {
                    chain,
                    tokens: {
                        some: {
                            token: {
                                address: { in: vaultsAddresses },
                            },
                        },
                    },
                },
                include: {
                    tokens: {
                        include: {
                            token: true,
                        },
                    },
                },
            });

            const vaultsInPools = vaultsAddresses.filter((address) =>
                pools.some((pool) => pool.tokens.some((token) => token.token.address.toLowerCase() === address)),
            );

            // query the required data for each vault on chain
            const calls: Multicaller3Call[] = [];
            for (const vault of vaultsInPools) {
                calls.push({
                    path: `${vault}.interestRate`,
                    address: vault as `0x${string}`,
                    abi: eulerVault,
                    functionName: 'interestRate',
                });
                calls.push({
                    path: `${vault}.cash`,
                    address: vault as `0x${string}`,
                    abi: eulerVault,
                    functionName: 'cash',
                });
                calls.push({
                    path: `${vault}.totalBorrows`,
                    address: vault as `0x${string}`,
                    abi: eulerVault,
                    functionName: 'totalBorrows',
                });
                calls.push({
                    path: `${vault}.interestFee`,
                    address: vault as `0x${string}`,
                    abi: eulerVault,
                    functionName: 'interestFee',
                });
            }

            const client = getViemClient(chain);

            const vaultsResponse = await multicallViem(client, calls);

            // compute APY on chain for each vault
            const apyCalls: Multicaller3Call[] = [];
            for (const vault of vaultsInPools) {
                apyCalls.push({
                    path: `${vault}.computeAPYs`,
                    address: this.lensContractAddress as `0x${string}`,
                    abi: eulerUtilsLens,
                    functionName: 'computeAPYs',
                    args: [
                        vaultsResponse[vault].interestRate,
                        vaultsResponse[vault].cash,
                        vaultsResponse[vault].totalBorrows,
                        vaultsResponse[vault].interestFee,
                    ],
                    parser: (response: ComputeAPYs) => formatUnits(response[1], 27),
                });
            }

            const apyResponse = await multicallViem(client, apyCalls);

            const aprs: { [tokenAddress: string]: { apr: number; isIbYield: boolean } } = {};

            // get the APY for each vault and return it
            for (const vault of vaultsInPools) {
                const apy = apyResponse[vault].computeAPYs;
                if (apy) {
                    aprs[vault] = { apr: parseFloat(apy), isIbYield: true };
                }
            }

            return aprs;
        } catch (error) {
            console.error(`Euler IB APR handler failed: `, error);
            return {};
        }
    }
}

interface EulerResponse {
    data: {
        assets: [
            {
                eTokenAddress: string;
                supplyAPY: string;
            },
        ];
    };
}
