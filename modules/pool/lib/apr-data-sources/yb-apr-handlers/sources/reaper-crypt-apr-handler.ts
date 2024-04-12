import { AprHandler } from '..';
import { getContractAt } from '../../../../../web3/contract';
import ReaperCryptStrategyAbi from './abis/ReaperCryptStrategy.json';
import axios from 'axios';
import ReaperCryptAbi from './abis/ReaperCrypt.json';
import { ReaperAprConfig } from '../../../../../network/apr-config-types';

const APR_PERCENT_DIVISOR = 10_000;

const sFTMxBaseApr = 0.046;
export class ReaperCryptAprHandler implements AprHandler {
    tokensWithSubgraphSource?: {
        [tokenName: string]: {
            address: string;
            isSftmX?: boolean;
            isWstETH?: boolean;
            isIbYield?: boolean;
        };
    };
    tokensWithOnChainSource?: {
        [tokenName: string]: {
            address: string;
            isSftmX?: boolean;
            isWstETH?: boolean;
            isIbYield?: boolean;
        };
    };
    subgraphUrl?: string;
    averageAPRAcrossLastNHarvests?: number;
    wstETHBaseApr: number = 0;

    readonly query = `query getVaults($ids: [ID!]) {
            vaults(where:{id_in: $ids}){
              id
              apr
            }
          }`;
    readonly group = 'REAPER';

    constructor(aprConfig: ReaperAprConfig) {
        this.tokensWithSubgraphSource = aprConfig.subgraphSource?.tokens;
        this.tokensWithOnChainSource = aprConfig.onchainSource?.tokens;
        this.subgraphUrl = aprConfig.subgraphSource?.subgraphUrl;
        this.averageAPRAcrossLastNHarvests = aprConfig.onchainSource?.averageAPRAcrossLastNHarvests;
    }

    async getAprs() {
        let multiStrategyAprs = {};
        let singleStrategyAprs = {};
        this.wstETHBaseApr = await this.getWstEthBaseApr();
        if (this.tokensWithSubgraphSource !== undefined) {
            multiStrategyAprs = await this.getAprFromSubgraph(this.tokensWithSubgraphSource);
        }
        if (this.tokensWithOnChainSource !== undefined) {
            singleStrategyAprs = await this.getOnChainCryptApr(this.tokensWithOnChainSource);
        }
        return { ...multiStrategyAprs, ...singleStrategyAprs };
    }

    private async getOnChainCryptApr(tokens: {
        [tokenName: string]: { address: string; isSftmX?: boolean; isWstETH?: boolean; isIbYield?: boolean };
    }): Promise<{ [tokenAddress: string]: { apr: number; isIbYield: boolean } }> {
        const aprs: { [tokenAddress: string]: { apr: number; isIbYield: boolean } } = {};
        for (const { address, isSftmX, isWstETH, isIbYield } of Object.values(tokens)) {
            try {
                const tokenContract = getContractAt(address, ReaperCryptAbi);
                const strategyAddress = await tokenContract.strategy();
                const strategyContract = getContractAt(strategyAddress, ReaperCryptStrategyAbi);
                let avgAprAcrossXHarvests = 0;

                avgAprAcrossXHarvests =
                    (await strategyContract.averageAPRAcrossLastNHarvests(this.averageAPRAcrossLastNHarvests)) /
                    APR_PERCENT_DIVISOR;
                // TODO hanlde this outside
                if (isSftmX) {
                    avgAprAcrossXHarvests = avgAprAcrossXHarvests * (1 + sFTMxBaseApr);
                }
                if (isWstETH) {
                    avgAprAcrossXHarvests = avgAprAcrossXHarvests * (1 + this.wstETHBaseApr);
                }
                aprs[address] = { apr: avgAprAcrossXHarvests, isIbYield: isIbYield ?? false };
            } catch (error) {
                console.error(`Reaper IB APR handler failed for onChain source: `, error);
                return {};
            }
        }

        return aprs;
    }

    private async getAprFromSubgraph(tokens: {
        [tokenName: string]: { address: string; isSftmX?: boolean; isWstETH?: boolean; isIbYield?: boolean };
    }): Promise<{ [tokenAddress: string]: number }> {
        try {
            const requestQuery = {
                operationName: 'getVaults',
                query: this.query,
                variables: {
                    ids: Object.values(tokens).map(({ address }) => address),
                },
            };
            const {
                data: { data },
            }: { data: { data: MultiStratResponse } } = await axios({
                method: 'post',
                url: this.subgraphUrl,
                data: JSON.stringify(requestQuery),
            });
            return data.vaults.reduce((acc, { id, apr }) => {
                const token = Object.values(tokens).find((token) => token.address.toLowerCase() === id.toLowerCase());
                if (!token) {
                    return acc;
                }
                let tokenApr = parseFloat(apr) / APR_PERCENT_DIVISOR;
                if (token.isSftmX) {
                    tokenApr = tokenApr * (1 + sFTMxBaseApr);
                }
                if (token.isWstETH) {
                    tokenApr = tokenApr * (1 + this.wstETHBaseApr);
                }
                return {
                    ...acc,
                    [id]: {
                        apr: tokenApr,
                        isIbYield: token.isIbYield ?? false,
                        group: this.group,
                    },
                };
            }, {});
        } catch (error) {
            console.error(`Reaper IB APR handler failed for subgraph source: `, error);
            return {};
        }
    }

    private async getWstEthBaseApr(): Promise<number> {
        const { data } = await axios.get<{
            data: { aprs: [{ timeUnix: number; apr: number }]; smaApr: number };
        }>('https://eth-api.lido.fi/v1/protocol/steth/apr/sma');
        return data.data.smaApr / 100;
    }
}
type MultiStratResponse = {
    vaults: {
        id: string;
        apr: string;
    }[];
};
