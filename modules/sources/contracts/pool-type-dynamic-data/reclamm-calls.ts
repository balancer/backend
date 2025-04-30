import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import reclamm from '../abis/reclamm';
import { formatEther } from 'viem';

type ReclammDynamicData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof reclamm, 'getReClammPoolDynamicData'>['outputs']
>[0];

export type ReclammCallsOutput = {
    pool: {
        typeData: {
            lastTimestamp: number;
            lastVirtualBalances: string[];
            dailyPriceShiftBase: string;
            centerednessMargin: string;
            currentFourthRootPriceRatio: string;
            startFourthRootPriceRatio: string;
            endFourthRootPriceRatio: string;
            priceRatioUpdateStartTime: number;
            priceRatioUpdateEndTime: number;
        };
    };
};

export const reclammCalls = (id: string): ViemMulticallCall[] => [
    {
        path: `${id}.pool.typeData`,
        address: id as `0x${string}`,
        abi: reclamm,
        functionName: 'getReClammPoolDynamicData',
        parser: (result: ReclammDynamicData) => {
            return {
                lastTimestamp: Number(result.lastTimestamp),
                lastVirtualBalances: result.lastVirtualBalances.map((balance) => formatEther(balance)),
                dailyPriceShiftBase: formatEther(result.dailyPriceShiftBase),
                centerednessMargin: formatEther(result.centerednessMargin),
                currentFourthRootPriceRatio: formatEther(result.currentFourthRootPriceRatio),
                startFourthRootPriceRatio: formatEther(result.startFourthRootPriceRatio),
                endFourthRootPriceRatio: formatEther(result.endFourthRootPriceRatio),
                priceRatioUpdateStartTime: Number(result.priceRatioUpdateStartTime),
                priceRatioUpdateEndTime: Number(result.priceRatioUpdateEndTime),
            };
        },
    },
];
