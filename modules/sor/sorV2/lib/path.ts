import { TokenAmount, SwapKind, Token } from '@balancer/sdk';
import { BasePool } from './pools/basePool';
import { PathOperation } from '../../types';

export class PathLocal {
    public readonly pools: BasePool[];
    public readonly tokens: Token[];
    public readonly operations: PathOperation[];

    public constructor(tokens: Token[], pools: BasePool[], operations: PathOperation[]) {
        if (pools.length === 0 || tokens.length < 2) {
            throw new Error('Invalid path: must contain at least 1 pool and 2 tokens.');
        }
        if (operations.length === 0 || operations.length !== pools.length) {
            throw new Error('Invalid path: operations length is incorrect');
        }
        if (tokens.length !== pools.length + 1) {
            throw new Error('Invalid path: tokens length must equal pools length + 1');
        }

        this.pools = pools;
        this.tokens = tokens;
        this.operations = operations;
    }
}

export class PathWithAmount extends PathLocal {
    public readonly swapAmount: TokenAmount;
    public readonly swapKind: SwapKind;
    public readonly outputAmount: TokenAmount;
    public readonly inputAmount: TokenAmount;
    private readonly mutateBalances: boolean;
    private readonly printPath: any = [];

    public constructor(
        tokens: Token[],
        pools: BasePool[],
        operations: PathOperation[] | undefined,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ) {
        super(tokens, pools, operations || new Array(pools.length).fill(PathOperation.Swap));
        this.swapAmount = swapAmount;
        this.mutateBalances = Boolean(mutateBalances);

        //call to super ensures this array access is safe
        if (tokens[0].isUnderlyingEqual(swapAmount.token)) {
            this.swapKind = SwapKind.GivenIn;
        } else {
            this.swapKind = SwapKind.GivenOut;
        }

        try {
            if (this.swapKind === SwapKind.GivenIn) {
                const amounts: TokenAmount[] = new Array(this.tokens.length);
                amounts[0] = this.swapAmount;
                for (let i = 0; i < this.pools.length; i++) {
                    const pool = this.pools[i];
                    let outputAmount;
                    if (this.operations && this.operations[i] === PathOperation.AddLiquidity) {
                        outputAmount = pool.addLiquiditySingleTokenExactIn(
                            this.tokens[i],
                            this.tokens[i + 1],
                            amounts[i],
                            this.mutateBalances,
                        );
                    } else if (this.operations && this.operations[i] === PathOperation.RemoveLiquidity) {
                        outputAmount = pool.removeLiquiditySingleTokenExactIn(
                            this.tokens[i + 1],
                            this.tokens[i],
                            amounts[i],
                            this.mutateBalances,
                        );
                    } else {
                        outputAmount = pool.swapGivenIn(
                            this.tokens[i],
                            this.tokens[i + 1],
                            amounts[i],
                            this.mutateBalances,
                        );
                    }
                    amounts[i + 1] = outputAmount;
                    this.printPath.push({
                        pool: pool.id,
                        input: `${amounts[i].amount.toString()} ${this.tokens[i].symbol}`,
                        output: `${outputAmount.amount.toString()} ${this.tokens[i + 1].symbol}`,
                    });
                }
                this.outputAmount = amounts[amounts.length - 1];
                this.inputAmount = this.swapAmount;
            } else {
                const amounts: TokenAmount[] = new Array(this.tokens.length);
                amounts[amounts.length - 1] = this.swapAmount;
                for (let i = this.pools.length; i >= 1; i--) {
                    const pool = this.pools[i - 1];
                    let inputAmount;
                    console.log(this.operations);
                    if (this.operations && this.operations[i - 1] === PathOperation.AddLiquidity) {
                        inputAmount = pool.addLiquiditySingleTokenExactOut(
                            this.tokens[i - 1],
                            this.tokens[i],
                            amounts[i],
                            this.mutateBalances,
                        );
                    } else if (this.operations && this.operations[i - 1] === PathOperation.RemoveLiquidity) {
                        inputAmount = pool.removeLiquiditySingleTokenExactOut(
                            this.tokens[i],
                            this.tokens[i - 1],
                            amounts[i],
                            this.mutateBalances,
                        );
                    } else {
                        inputAmount = pool.swapGivenOut(
                            this.tokens[i - 1],
                            this.tokens[i],
                            amounts[i],
                            this.mutateBalances,
                        );
                    }
                    amounts[i - 1] = inputAmount;
                    this.printPath.push({
                        pool: pool.id,
                        input: `${inputAmount.amount.toString()} ${this.tokens[i - 1].symbol}`,
                        output: `${amounts[i].amount.toString()} ${this.tokens[i].symbol}`,
                    });
                }
                this.printPath = this.printPath.reverse();
                this.inputAmount = amounts[0];
                this.outputAmount = this.swapAmount;
            }
        } catch {
            throw new Error('Invalid path, swap amount exceeds maximum for pool');
        }
    }

    public print(): void {
        console.table(this.printPath);
    }
}
