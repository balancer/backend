// yarn vitest sor-debug.test.ts
import { Chain } from '@prisma/client';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { PoolController } from '../controllers/pool-controller';
import { TokenController } from '../controllers/token-controller';
import { ContentController } from '../controllers/content-controller';
import { sorService } from './sor.service';
import { tokenService } from '../token/token.service';

describe('sor debugging', () => {
    it('sor v2', async () => {
        const useProtocolVersion = 2;
        const chain = Chain.SONIC;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);

        // only do once before starting to debug
        // await PoolController().addPoolsV2(chain);
        // await PoolController().syncOnchainDataForAllPoolsV2(chain);
        // await PoolController().syncChangedPoolsV2(chain);

        // to update liquidity values, first update the token prices: yarn vitest token.service.test.ts
        // await PoolController().updateLiquidityValuesForActivePools(chain);

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xd3dce716f3ef535c5ff8d041c1a41c3bd89b97ae', // scUSD
            tokenOut: '0x3bce5cb273f0f148010bbea2470e7b5df84c7812', // sETH
            swapType: 'EXACT_OUT',
            swapAmount: '1',
            useProtocolVersion,
            // callDataInput: {
            //     receiver: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     sender: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     slippagePercentage: '0.1',
            // },
            poolIds: ['0xe7734b495a552ab6f4c78406e672cca7175181e10002000000000000000000c5'],
        });

        console.log(swaps.returnAmount);
        for (const route of swaps.routes) {
            for (const hop of route.hops) {
                console.log(hop.pool.id);
            }
        }

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
        // await ContentController().syncErc4626Data();

        // to update liquidity values, first update the token prices: yarn vitest token.service.test.ts
        // await PoolController().updateLiquidityValuesForActivePools(chain);

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xb19382073c7a0addbb56ac6af1808fa49e377b75', // BAL
            tokenOut: '0xb77eb1a70a96fdaaeb31db1b42f2b8b5846b2613', // DAI
            swapType: 'EXACT_IN',
            swapAmount: '0.01',
            useProtocolVersion,
            poolIds: ['0x80fd5bc9d4fa6c22132f8bb2d9d30b01c3336fb3'], // gyroECLP
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
