import { cloneDeep } from 'lodash';
import { PathWithAmount } from './pathGraph/path';
import {
    BatchSwapStep,
    DEFAULT_FUND_MANAGMENT,
    DEFAULT_USERDATA,
    NATIVE_ADDRESS,
    SingleSwap,
    SwapKind,
    ZERO_ADDRESS,
} from './types';
import { Chain } from '@prisma/client';
import { TokenAmount } from './tokenAmount';
import { abs } from './utils/math';
import { replaceEthWithZeroAddress } from '../../../web3/addresses';

// A Swap can be a single or multiple paths
export class Swap {
    public constructor({ paths, swapKind }: { paths: PathWithAmount[]; swapKind: SwapKind }) {
        if (paths.length === 0) throw new Error('Invalid swap: must contain at least 1 path.');

        // paths with immutable pool balances
        this.pathsImmutable = cloneDeep(paths);

        // Recalculate paths while mutating pool balances
        this.paths = paths.map((path) => new PathWithAmount(path.tokens, path.pools, path.swapAmount, true));
        this.chain = paths[0].tokens[0].chain;
        this.swapKind = swapKind;
        this.isBatchSwap = paths.length > 1 || paths[0].pools.length > 1;
        this.assets = [...new Set(paths.flatMap((p) => p.tokens).map((t) => t.address))];
        const swaps = this.getSwaps(this.paths);

        this.assets = this.assets.map((a) => {
            return this.convertNativeAddressToZero(a);
        });

        this.swaps = swaps;
    }

    public readonly chain: Chain;
    public readonly isBatchSwap: boolean;
    public readonly paths: PathWithAmount[];
    public readonly pathsImmutable: PathWithAmount[];
    public readonly assets: string[];
    public readonly swapKind: SwapKind;
    public swaps: BatchSwapStep[] | SingleSwap;

    public get quote(): TokenAmount {
        return this.swapKind === SwapKind.GivenIn ? this.outputAmount : this.inputAmount;
    }

    public get inputAmount(): TokenAmount {
        return this.getInputAmount(this.paths);
    }

    public get outputAmount(): TokenAmount {
        return this.getOutputAmount(this.paths);
    }

    // rpcUrl is optional, but recommended to prevent rate limiting
    public async query(rpcUrl?: string, block?: bigint): Promise<TokenAmount> {
        const client = createPublicClient({
            transport: http(rpcUrl),
        });

        const queriesContract = getContract({
            address: BALANCER_QUERIES[this.chain],
            abi: balancerQueriesAbi,
            client,
        });

        let amount: TokenAmount;
        if (this.isBatchSwap) {
            const { result } = await queriesContract.simulate.queryBatchSwap(
                [this.swapKind, this.swaps as BatchSwapStep[], this.assets, DEFAULT_FUND_MANAGMENT],
                {
                    blockNumber: block,
                },
            );

            amount =
                this.swapKind === SwapKind.GivenIn
                    ? TokenAmount.fromRawAmount(
                          this.outputAmount.token,
                          abs(result[this.assets.indexOf(replaceEthWithZeroAddress(this.outputAmount.token.address))]),
                      )
                    : TokenAmount.fromRawAmount(
                          this.inputAmount.token,
                          abs(result[this.assets.indexOf(replaceEthWithZeroAddress(this.inputAmount.token.address))]),
                      );
        } else {
            const { result } = await queriesContract.simulate.querySwap(
                [this.swaps as SingleSwap, DEFAULT_FUND_MANAGMENT],
                { blockNumber: block },
            );

            amount =
                this.swapKind === SwapKind.GivenIn
                    ? TokenAmount.fromRawAmount(this.outputAmount.token, result)
                    : TokenAmount.fromRawAmount(this.inputAmount.token, result);
        }

        return amount;
    }

    public queryCallData(): string {
        let callData: string;
        if (this.isBatchSwap) {
            callData = encodeFunctionData({
                abi: balancerQueriesAbi,
                functionName: 'queryBatchSwap',
                args: [this.swapKind, this.swaps as BatchSwapStep[], this.assets, DEFAULT_FUND_MANAGMENT],
            });
        } else {
            callData = encodeFunctionData({
                abi: balancerQueriesAbi,
                functionName: 'querySwap',
                args: [this.swaps as SingleSwap, DEFAULT_FUND_MANAGMENT],
            });
        }
        return callData;
    }

    public get priceImpact(): PriceImpactAmount {
        const paths = this.pathsImmutable;

        const pathsReverse = paths.map(
            (path) =>
                new PathWithAmount(
                    [...path.tokens].reverse(),
                    [...path.pools].reverse(),
                    this.swapKind === SwapKind.GivenIn ? path.outputAmount : path.inputAmount,
                ),
        );

        const amountInitial =
            this.swapKind === SwapKind.GivenIn ? this.getInputAmount(paths).amount : this.getOutputAmount(paths).amount;

        const amountFinal =
            this.swapKind === SwapKind.GivenIn
                ? this.getOutputAmount(pathsReverse).amount
                : this.getInputAmount(pathsReverse).amount;

        const priceImpact = MathSol.divDownFixed(abs(amountInitial - amountFinal), amountInitial * 2n);
        return PriceImpactAmount.fromRawAmount(priceImpact);
    }

    // public get executionPrice(): Price {}

    // helper methods

    private getSwaps(paths: PathWithAmount[]) {
        let swaps: BatchSwapStep[] | SingleSwap;
        if (this.isBatchSwap) {
            swaps = [] as BatchSwapStep[];
            if (this.swapKind === SwapKind.GivenIn) {
                paths.map((p) => {
                    p.pools.map((pool, i) => {
                        (swaps as BatchSwapStep[]).push({
                            poolId: pool.id,
                            assetInIndex: BigInt(this.assets.indexOf(p.tokens[i].address)),
                            assetOutIndex: BigInt(this.assets.indexOf(p.tokens[i + 1].address)),
                            amount: i === 0 ? p.inputAmount.amount : 0n,
                            userData: DEFAULT_USERDATA,
                        });
                    });
                });
            } else {
                paths.map((p) => {
                    // Vault expects given out swaps to be in reverse order
                    const reversedPools = [...p.pools].reverse();
                    const reversedTokens = [...p.tokens].reverse();
                    reversedPools.map((pool, i) => {
                        (swaps as BatchSwapStep[]).push({
                            poolId: pool.id,
                            assetInIndex: BigInt(this.assets.indexOf(reversedTokens[i + 1].address)),
                            assetOutIndex: BigInt(this.assets.indexOf(reversedTokens[i].address)),
                            amount: i === 0 ? p.outputAmount.amount : 0n,
                            userData: DEFAULT_USERDATA,
                        });
                    });
                });
            }
        } else {
            const path = this.paths[0];
            const pool = path.pools[0];
            const assetIn = replaceEthWithZeroAddress(path.tokens[0].address);
            const assetOut = replaceEthWithZeroAddress(path.tokens[1].address);
            swaps = {
                poolId: pool.id,
                kind: this.swapKind,
                assetIn,
                assetOut,
                amount: path.swapAmount.amount,
                userData: DEFAULT_USERDATA,
            } as SingleSwap;
        }
        return swaps;
    }

    private getInputAmount(paths: PathWithAmount[]): TokenAmount {
        if (!paths.every((p) => p.inputAmount.token.isEqual(paths[0].inputAmount.token))) {
            throw new Error('Input amount can only be calculated if all paths have the same input token');
        }
        const amounts = paths.map((path) => path.inputAmount);
        return amounts.reduce((a, b) => a.add(b));
    }

    private getOutputAmount(paths: PathWithAmount[]): TokenAmount {
        if (!paths.every((p) => p.outputAmount.token.isEqual(paths[0].outputAmount.token))) {
            throw new Error('Output amount can only be calculated if all paths have the same output token');
        }
        const amounts = paths.map((path) => path.outputAmount);
        return amounts.reduce((a, b) => a.add(b));
    }
}
