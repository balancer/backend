import { Abi, ContractFunctionArgs, ContractFunctionName, ReadContractParameters, parseAbi } from 'viem';
import { ViemClient } from '../types';
import { vaultV3Abi } from './abis/VaultV3';

type PoolTokenInfo = {
    tokens: `0x${string}`[];
    tokenTypes: number[];
    balancesRaw: bigint[];
    decimalScalingFactors: bigint[];
    rateProviders: `0x${string}`[];
};

const abi = parseAbi([
    'function getPoolTokenInfo(address pool) view returns (address[] tokens, uint8[] tokenTypes, uint[] balancesRaw, uint[] decimalScalingFactors, address[] rateProviders)',
]);


export async function fetchPoolTokens(vault: string, pools: string[], client: ViemClient) {


    function createArgs<
        ABI extends Abi | readonly unknown[],
        FunctionName extends ContractFunctionName<ABI, 'pure' | 'view'>,
        Args extends ContractFunctionArgs<ABI, 'pure' | 'view', FunctionName>,
    >({abi, functionName, args}: {abi: ABI, functionName: FunctionName, args: Args})
    : ReadContractParameters<ABI, FunctionName, Args> {
    return {
            abi, functionName, args
        } as ReadContractParameters<ABI, FunctionName, Args>;
    }

  const contracts = pools
  .map((pool) => [
      {
          ...createArgs({
            abi: vaultV3Abi,
            functionName: 'getPoolTokenInfo',
            args: [pool as `0x${string}`]}),
          address: vault as `0x${string}`,
      } as const,
      {
          ...createArgs({abi: vaultV3Abi, functionName: 'getPoolTokenRates', args: [pool as `0x${string}`]}),
          address: vault as `0x${string}`,
      } as const,
  ])
  .flat();


    const results = await client.multicall({ contracts: contracts });

    const data = await client.readContract({
        address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
        abi: vaultV3Abi,
        functionName: 'getPoolTokenInfo' as 'getPoolTokenInfo',
        args: ['0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC'],
    });

    // Parse the results
    const parsedResults = results
        .map((result, i) => {
            if (result.status === 'success' && result.result !== undefined) {
                // parse the result here using the abi
                const poolTokens = {
                    tokens: result.result[0],
                    tokenTypes: result.result[1],
                    balancesRaw: result.result[2],
                    decimalScalingFactors: result.result[3],
                    rateProviders: result.result[4],
                } as PoolTokenInfo;

                return [pools[i], poolTokens];
            }
            // Handle the error
            return undefined;
        })
        .filter((result): result is NonNullable<typeof result> => result !== undefined);

    return Object.fromEntries(parsedResults) as Record<string, PoolTokenInfo>;
}
