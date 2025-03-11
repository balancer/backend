// yarn vitest token.service.test.ts

import { expect, test } from 'vitest';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { AllNetworkConfigs } from '../network/network-config';
import { tokenService } from './token.service';
import {
    SftmxController,
    SnapshotsController,
    UserBalancesController,
    CowAmmController,
    AprsController,
    ContentController,
    FXPoolsController,
    PoolController,
    EventController,
    PoolMutationController,
    StakingController,
    TokenController,
} from '../../modules/controllers';

test('debug token price', async () => {
    const chain = 'SONIC';
    const chainId = '146';

    initRequestScopedContext();
    setRequestScopedContextValue('chainId', chainId);

    // swaps are required to populate coingecko IDs
    // let swaps = await EventController().syncSwapsV3(chain);
    // while (swaps.length > 1) {
    //     swaps = await EventController().syncSwapsV3(chain);
    // }

    // await tokenService.syncTokenContentData(chain);
    // await TokenController().syncErc4626Tokens(chain);
    // await TokenController().syncErc4626UnwrapRates(chain);
    await tokenService.updateTokenPrices([chain]);
    const prices = await tokenService.getCurrentTokenPrices([chain]);

    console.log(prices.find((price) => price.tokenAddress === '0x016c306e103fbf48ec24810d078c65ad13c5f11b'));
    const b = 123;
    console.log(b);
    expect(1 + 2).toBe(3);
});
// describe('Token service', () => {
//     test('same token address for in two chains', async () => {
//         const address = '0x1509706a6c66ca549ff0cb464de88231ddbe213b';
//         const prices = await tokenService.getWhiteListedTokenPrices(['GNOSIS', 'ARBITRUM']);
//         const filtered = prices.filter((token) => token.tokenAddress === address);
//         expect(filtered.length).toBe(2);
//     });

//     test('update prices', async () => {
//         initRequestScopedContext();
//         setRequestScopedContextValue('chainId', '146');

//         await tokenService.updateTokenPrices(['SONIC']);
//         const prices = await tokenService.getCurrentTokenPrices(['SONIC']);

//         console.log(prices.find((price) => price.tokenAddress === '0x0c4e186eae8acaa7f7de1315d5ad174be39ec987'));
//     }, 500000);

//     test('sync tokens from pool tokens', async () => {
//         initRequestScopedContext();
//         setRequestScopedContextValue('chainId', '146');
//         await tokenService.syncTokenContentData('SONIC');
//     }, 1000000);

//     test('get tokens', async () => {
//         initRequestScopedContext();
//         setRequestScopedContextValue('chainId', '250');
//         const list = await tokenService.getTokenDefinitions(['FANTOM']);
//         expect(list.length).toBeGreaterThan(0);
//     });
//     test('get tokens filter', async () => {
//         initRequestScopedContext();
//         setRequestScopedContextValue('chainId', '250');
//         const list = await tokenService.getTokenDefinitions({
//             chains: ['FANTOM'],
//             where: { tokensIn: ['0xd7028092c830b5c8fce061af2e593413ebbc1fc1'] },
//         });
//         console.log(list);
//         expect(list.length).toBe(1);
//     });
// });
