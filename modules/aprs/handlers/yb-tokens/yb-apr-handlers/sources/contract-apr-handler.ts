import { Chain } from '@prisma/client';
import { YbAprHandler, AprContractFetchConfig, TokenApr } from '../../types';
import { getViemClient } from '../../../../../sources/viem-client';
import { multicallViem } from '../../../../../web3/multicaller-viem';
import { parseAbiItem } from 'viem';
import _ from 'lodash';

export const contractAprHandler: YbAprHandler = async ({ calls }: { calls: AprContractFetchConfig[] }) => {
    // group calls by chain
    const callsByChain = _.groupBy(calls, 'chain');

    // for each chain, execute multicall
    const results: TokenApr[] = [];

    for (const chain in callsByChain) {
        const client = getViemClient(chain as Chain);

        const contracts = callsByChain[chain].map((call) => ({
            address: call.contract as `0x${string}`,
            abi: [parseAbiItem(call.abi)],
            functionName: call.functionName,
            args: call.args,
            parser: call.parser,
            path: call.token,
        }));

        const result = await multicallViem(client, contracts);

        Object.entries(result).forEach(([address, apr]) => results.push({ address, apr }));
    }

    return results;
};
