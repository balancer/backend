import { formatUnits } from 'viem';
import { TokenApr, TokenYieldConfig, TokenYieldHandler } from '../../types';
import { getViemClient } from '../../../sources/viem-client';
import { hypurrfiVaultLensAbi } from './abis/hypurrfi-vault-lens';

const VAULT_LENS = '0x0eaDDE9EfCf1540dcA8f94e813E12db55f8405a8';

export const hypurrFiPrimeYieldHandler: TokenYieldHandler = async (config: TokenYieldConfig['hypurrfiPrime']) => {
    try {
        const client = getViemClient('HYPEREVM');

        const results = await client.multicall({
            contracts: config!.vaults.map((vault) => ({
                address: VAULT_LENS as `0x${string}`,
                abi: hypurrfiVaultLensAbi,
                functionName: 'getVaultInfoFull' as const,
                args: [vault as `0x${string}`],
            })),
            allowFailure: true,
        });

        const aprs: TokenApr[] = [];

        for (let i = 0; i < config!.vaults.length; i++) {
            const result = results[i];
            if (result.status !== 'success') continue;
            const { irmInfo } = result.result;
            if (irmInfo.queryFailure) continue;
            const rateInfo = irmInfo.interestRateInfo[0];
            if (!rateInfo) continue;
            // supplyAPY is 27-decimal ray format; formatUnits(value, 27) gives the float (e.g. 0.015 = 1.5%)
            aprs.push({ address: config!.vaults[i].toLowerCase(), apr: Number(formatUnits(rateInfo.supplyAPY, 27)) });
        }

        return aprs;
    } catch (error) {
        throw Error(`HypurrFi prime vault APR handler failed: ${(error as Error).message}`);
    }
};
