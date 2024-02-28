import { formatEther } from 'viem';
import { GqlSorSwapType, GqlSorGetSwapsResponse, GqlSorSwapOptionsInput } from '../../../schema';
import { GetSwapsInput, SwapService, SwapResult } from '../types';
import { BalancerSorService } from './balancer-sor.service';
import { tokenService } from '../../token/token.service';
import { TokenAmount } from '@balancer/sdk';

class SwapResultV1 implements SwapResult {
    public inputAmount: bigint = BigInt(0);
    public outputAmount: bigint = BigInt(0);
    public isValid: boolean;

    constructor(private swap: GqlSorGetSwapsResponse | null, private swapType: GqlSorSwapType) {
        if (swap === null) {
            this.isValid = false;
            this.swap = null;
        } else {
            this.inputAmount =
                swapType === 'EXACT_IN' ? BigInt(swap.swapAmountScaled) : BigInt(swap.returnAmountScaled);
            this.outputAmount =
                swapType === 'EXACT_IN' ? BigInt(swap.returnAmountScaled) : BigInt(swap.swapAmountScaled);
            this.isValid = swap.swaps.length === 0 ? false : true;
        }
    }

    async getSorSwapResponse(queryFirst: boolean): Promise<GqlSorGetSwapsResponse> {
        if (!this.isValid || this.swap === null) throw new Error('No Response - Invalid Swap');
        // never query onchain for old v1 service
        return this.swap;
    }
}
export class SorV1BeetsService implements SwapService {
    sorService: BalancerSorService;

    constructor() {
        this.sorService = new BalancerSorService();
    }

    public async getSwapResult(input: GetSwapsInput & { swapOptions: GqlSorSwapOptionsInput }): Promise<SwapResult> {
        try {
            const swap = await this.querySorV1(input);
            return new SwapResultV1(swap, input.swapType);
        } catch (err) {
            console.log(`sorV1 Service Error`, err);
            return new SwapResultV1(null, input.swapType);
        }
    }

    public zeroResponse(
        swapType: GqlSorSwapType,
        tokenIn: string,
        tokenOut: string,
        swapAmount: TokenAmount,
    ): GqlSorGetSwapsResponse {
        return this.sorService.zeroResponse(swapType, tokenIn, tokenOut, formatEther(swapAmount.scale18));
    }

    private async querySorV1(
        input: GetSwapsInput & { swapOptions: GqlSorSwapOptionsInput },
    ): Promise<GqlSorGetSwapsResponse> {
        // Explicitly pass chain to getTokens to avoid using the default chain
        const tokens = await tokenService.getTokens(undefined, input.chain);
        return await this.sorService.getSwaps({ ...input, tokens, swapAmount: formatEther(input.swapAmount.scale18) });
    }
}

export const sorV1BeetsService = new SorV1BeetsService();
