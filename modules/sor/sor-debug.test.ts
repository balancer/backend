// yarn vitest sor-debug.test.ts
import { Chain } from '@prisma/client';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { PoolController } from '../controllers/pool-controller';
import { TokenController } from '../controllers/token-controller';
import { sorService } from './sor.service';

describe('sor debugging', () => {
    it('sor v2', async () => {
        const useProtocolVersion = 2;
        const chain = Chain.GNOSIS;

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
            tokenIn: '0xfa771dd0237e80c22ab8fbfd98c1904663b46e36', // sCRC
            tokenOut: '0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1', // WETH
            swapType: 'EXACT_IN',
            swapAmount: '10',
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
        const chain = Chain.SEPOLIA;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        // only do once before starting to debug
        // await PoolController().reloadPoolsV3(chain);
        // await PoolController().syncHookData(chain);
        // await TokenController().syncErc4626Tokens(chain);
        // await TokenController().syncErc4626UnwrapRates(chain);

        // to update liquidity values, first update the token prices through a mutation
        // yarn dev; yarn mutation 'tokenReloadTokenPrices(chains: [MAINNET])' 1
        // await PoolController().updateLiquidityValuesForActivePools(chain);

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8', // USDCaave
            tokenOut: '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0', // USDTaave
            swapType: 'EXACT_IN',
            swapAmount: '10000',
            useProtocolVersion,
            considerPoolsWithHooks: true,
            // poolIds: ['0x9b677c72a1160e1e03fe542bfd2b0f373fa94a8c'], // boosted
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
