import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import stableV3 from '../abis/stable-v3';

type AmplificationParameters = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof stableV3, 'getAmplificationParameter'>['outputs']
>;

export const stableContractCalls = (ids: string[]): ViemMulticallCall[] => {
    return ids.map((id) => ({
        path: `${id}.amplificationParameter`,
        address: id as `0x${string}`,
        abi: stableV3,
        functionName: 'getAmplificationParameter',
    }));
};

export const parseStableContractCalls = (result: { amplificationParameter: AmplificationParameters }): any => {
    return {
        amp: String(result.amplificationParameter[0] / result.amplificationParameter[2]),
    };
};
