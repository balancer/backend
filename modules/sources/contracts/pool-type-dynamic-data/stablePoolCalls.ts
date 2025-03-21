import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import stableV3 from '../abis/stable-v3';
import { formatEther } from 'viem';

type AmplificationParameters = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof stableV3, 'getAmplificationParameter'>['outputs']
>;
type GetRate = AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof stableV3, 'getRate'>['outputs']>[0];

export const stableContractCalls = (id: string): ViemMulticallCall[] => [
    {
        path: `${id}.pool.typeData.amp`,
        address: id as `0x${string}`,
        abi: stableV3,
        functionName: 'getAmplificationParameter',
        parser: (result: AmplificationParameters) => String(result[0] / result[2]),
    },
    {
        path: `${id}.pool.typeData.bptPriceRate`,
        address: id as `0x${string}`,
        abi: stableV3,
        functionName: 'getRate',
        parser: (result: GetRate) => formatEther(result),
    },
];
