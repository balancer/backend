import { set } from 'lodash';
import { Fragment, JsonFragment, Interface, Result } from '@ethersproject/abi';
import { Provider } from '@ethersproject/providers';
import _ from 'lodash';
import ERC20Abi from './abi/ERC20.json';
import { BigNumber } from 'ethers';
import { getContractAt } from './contract';
import multicall3Abi from '../web3/abi/Multicall3.json';

export interface MulticallUserBalance {
    erc20Address: string;
    userAddress: string;
    balance: BigNumber;
}

export class Multicaller {
    private multiAddress: string;
    private interface: Interface;
    private calls: [string, string, any, boolean][] = [];
    private paths: any[] = [];

    constructor(multiAddress: string, abi: string | Array<Fragment | JsonFragment | string>) {
        this.multiAddress = multiAddress;
        this.interface = new Interface(abi);
    }

    call(path: string, address: string, functionName: string, params?: any[], allowFailure = true): Multicaller {
        this.calls.push([address, functionName, params, allowFailure]);
        this.paths.push(path);
        return this;
    }

    async execute<T extends Record<string, any>>(from = {}): Promise<T> {
        const obj = from;
        // not print the full exception for now, not polluting the log too much
        try {
            const results = await this.executeMulticall();
            results.forEach((result, i) => set(obj, this.paths[i], result.length > 1 ? result : result[0]));
        } catch (err) {
            console.log('multicall error', err);
            throw `Non-stacktrace multicall error`;
        }
        this.calls = [];
        this.paths = [];
        return obj as T;
    }

    private async executeMulticall(): Promise<Result[]> {
        const multi = getContractAt(this.multiAddress, multicall3Abi);

        const results:{ success: boolean; returnData: string }[] = await multi.aggregate3(
            this.calls.map(([address, functionName, params, allowFailure]) => [
                address,
                allowFailure,
                this.interface.encodeFunctionData(functionName, params),
            ]),
        );

        return res.map((result: any, i: number) => success ? this.interface.decodeFunctionResult(this.calls[i][1], result): );
    }

    public get numCalls() {
        return this.calls.length;
    }

    public static async fetchBalances({
        multicallAddress,
        provider,
        balancesToFetch,
    }: {
        multicallAddress: string;
        provider: Provider;
        balancesToFetch: { erc20Address: string; userAddress: string }[];
    }): Promise<MulticallUserBalance[]> {
        const chunks = _.chunk(balancesToFetch, 100);
        let data: MulticallUserBalance[] = [];

        for (const chunk of chunks) {
            const multicall = new Multicaller(multicallAddress, provider, ERC20Abi);

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
