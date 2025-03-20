import { ContractFunctionParameters } from 'viem';

export interface IMulticaller {
    numCalls: number;
    call(path: string, address: string, functionName: string, params?: any[], allowFailure?: boolean): IMulticaller;
    execute<T>(): Promise<T>;
}

export type Multicaller3Call = {
    path?: string;
    parser?: (params: any, results: any, index: number) => any;
} & ContractFunctionParameters;
