// yarn vitest sor-debug.test.ts
import { Chain } from '@prisma/client';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { PoolController } from '../controllers/pool-controller';
import { TokenController } from '../controllers/token-controller';
import { ContentController } from '../controllers/content-controller';
import { sorService } from './sor.service';

describe('sor debugging', () => {
    it('sor v2', async () => {
        const useProtocolVersion = 2;
        const chain = Chain.ARBITRUM;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        //only do once before starting to debug
        // await PoolController().addPoolsV2(chain);
        // await PoolController().syncOnchainDataForAllPoolsV2(chain);
        // await PoolController().syncChangedPoolsV2(chain);
        // await PoolController().updateLiquidityValuesForActivePools(chain);

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC
            tokenOut: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH
            swapType: 'EXACT_OUT',
            swapAmount: '0.00000040526107834',
            useProtocolVersion,
            // callDataInput: {
            //     receiver: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     sender: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     slippagePercentage: '0.1',
            // },
        });

        console.log(swaps.returnAmount);
        expect(parseFloat(swaps.returnAmount)).toBeGreaterThan(0);
    }, 5000000);

    it('sor v3', async () => {
        const useProtocolVersion = 3;
        const chain = Chain.ARBITRUM;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        // only do once before starting to debug
        // await PoolController().reloadPoolsV3(chain);
        // await PoolController().syncHookData(chain);
        // await TokenController().syncErc4626Tokens(chain);
        // await TokenController().syncErc4626UnwrapRates(chain);
        // await ContentController().syncErc4626Data();

        // to update liquidity values, first update the token prices through a mutation
        // yarn dev; yarn mutation 'tokenReloadTokenPrices(chains: [MAINNET])' 1
        // await PoolController().updateLiquidityValuesForActivePools(chain);

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT0
            tokenOut: '0x7788a3538c5fc7f9c7c8a74eac4c898fc8d87d92', // sUSDx
            swapType: 'EXACT_IN',
            swapAmount: '5',
            useProtocolVersion,
            poolIds: ['0xc2b0d1a1b4cdda10185859b5a5c543024c2df869'], // boosted
        });

        console.log(swaps.returnAmount);
        for (const route of swaps.routes) {
            for (const hop of route.hops) {
                console.log(hop.pool.address);
            }
        }
        expect(parseFloat(swaps.returnAmount)).toBeGreaterThan(0);
    }, 5000000);
});
