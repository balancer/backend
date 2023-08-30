import { set } from 'lodash';
import { Fragment, JsonFragment, Interface, Result } from '@ethersproject/abi';
import { Provider } from '@ethersproject/providers';
import _ from 'lodash';
import ERC20Abi from './abi/ERC20.json';
import { BigNumber } from 'ethers';
import { getContractAt } from './contract';
import multicall3Abi from '../web3/abi/Multicall3.json';
import { networkContext } from '../network/network-context.service';

export interface MulticallUserBalance {
    erc20Address: string;
    userAddress: string;
    balance: BigNumber;
}

type MulticallResult = { success: boolean; returnData: string };

export class Multicaller3 {
    private interface: Interface;
    private calls: [string, string, any, boolean][] = [];
    private paths: any[] = [];
    private batchSize: number;

    constructor(abi: string | Array<Fragment | JsonFragment | string>, batchSize = 100) {
        this.interface = new Interface(abi);
        this.batchSize = batchSize;
    }

    call(path: string, address: string, functionName: string, params?: any[], allowFailure = true): Multicaller3 {
        this.calls.push([address, functionName, params, allowFailure]);
        this.paths.push(path);
        return this;
    }

    async execute<T extends Record<string, any>>(): Promise<T> {
        const returnObject = {};
        const multicallContract = getContractAt(networkContext.data.multicall3, multicall3Abi);
        const chunks = _.chunk(this.calls, this.batchSize);
        const results: MulticallResult[] = [];
        for (const chunk of chunks) {
            const res = (await multicallContract.callStatic.aggregate3(
                chunk.map(([address, functionName, params, allowFailure]) => [
                    address,
                    allowFailure,
                    this.interface.encodeFunctionData(functionName, params),
                ]),
            )) as MulticallResult[];
            results.push(...res);
        }

        let i = 0;
        for (const result of results) {
            let resultValue: Result | undefined = undefined;
            if (result.success) {
                resultValue = this.interface.decodeFunctionResult(this.calls[i][1], result.returnData);
                set(returnObject, this.paths[i], resultValue.length > 1 ? resultValue : resultValue[0]);
            } else {
                set(returnObject, this.paths[i], undefined);
            }
            i++;
        }
        this.calls = [];
        this.paths = [];
        return returnObject as T;
    }

    public get numCalls() {
        return this.calls.length;
    }

    public static async fetchBalances({
        multicallAddress,
        balancesToFetch,
    }: {
        multicallAddress: string;
        provider: Provider;
        balancesToFetch: { erc20Address: string; userAddress: string }[];
    }): Promise<MulticallUserBalance[]> {
        const chunks = _.chunk(balancesToFetch, 100);
        let data: MulticallUserBalance[] = [];

        for (const chunk of chunks) {
            const multicall = new Multicaller3(ERC20Abi);

            for (const { erc20Address, userAddress } of chunk) {
                multicall.call(`${erc20Address}.${userAddress}`, erc20Address, 'balanceOf', [userAddress]);
            }

            const response = (await multicall.execute()) as {
                [erc20Address: string]: { [userAddress: string]: BigNumber };
            };

            data = [
                ...data,
                ..._.map(response, (item, erc20Address) =>
                    _.map(item, (balance, userAddress) => ({
                        erc20Address: erc20Address.toLowerCase(),
                        userAddress: userAddress.toLowerCase(),
                        balance,
                    })),
                ).flat(),
            ];
        }

        return data;
    }
}
