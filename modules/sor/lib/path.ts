import { TokenAmount, SwapKind, Token } from '@balancer/sdk';
import { BasePool } from './poolsV2/basePool';

export class PathLocal {
    public readonly pools: BasePool[];
    public readonly tokens: Token[];
    public readonly isBuffer: boolean[];

    public constructor(tokens: Token[], pools: BasePool[], isBuffer: boolean[]) {
        if (pools.length === 0 || tokens.length < 2) {
            throw new Error('Invalid path: must contain at least 1 pool and 2 tokens.');
        }
        if (tokens.length !== pools.length + 1) {
            throw new Error('Invalid path: tokens length must equal pools length + 1');
        }

        if (isBuffer.length !== pools.length) {
            throw new Error('Invalid path: isBuffer length must equal pools length');
        }

        this.pools = pools;
        this.tokens = tokens;
        this.isBuffer = isBuffer;
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
        isBuffer: boolean[],
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ) {
        super(tokens, pools, isBuffer);
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
                    const outputAmount = pool.swapGivenIn(
                        this.tokens[i],
                        this.tokens[i + 1],
                        amounts[i],
                        this.mutateBalances,
                    );
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
                    const inputAmount = pool.swapGivenOut(
                        this.tokens[i - 1],
                        this.tokens[i],
                        amounts[i],
                        this.mutateBalances,
                    );
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
        } catch (error) {
            throw new Error('Invalid swap path with error: ' + error);
        }
    }

    public print(): void {
        console.table(this.printPath);
    }
}
