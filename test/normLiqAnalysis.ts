import { initRequestScopedContext, setRequestScopedContextValue } from '../modules/context/request-scoped-context';
import { AllNetworkConfigs } from '../modules/network/network-config';
import { networkContext } from '../modules/network/network-context.service';
import { poolService } from '../modules/pool/pool.service';
import { sorService } from '../modules/sor/sor.service';
import { syncLatestFXPrices } from '../modules/token/latest-fx-price';

async function debugScript() {
    const chainId = '1';
    const config = AllNetworkConfigs[chainId].data;
    const subgraphUrl = config.subgraphs.balancer;
    const chain = config.chain.prismaId;
    initRequestScopedContext();
    setRequestScopedContextValue('chainId', chainId);
    // run only once to sync pools - comment out for future analysis runs
    // await poolService.syncAllPoolsFromSubgraph();
    // await poolService.loadOnChainDataForAllPools();
    // await syncLatestFXPrices(subgraphUrl, chain);

    // BAL, WETH, DAI, wstETH, rETH, GNO, AAVE
    const tokens = [
        '0xba100000625a3754423978a60c9317c58a424e3d', // BAL
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0', // wstETH
        '0xae78736cd615f374d3085123a210448e74fc6393', // rETH
        '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
        '0x6810e776880c02933d47db1b9fc05908e5386b96', // GNO
        '0xe07f9d810a48ab5c3c914ba3ca53af14e4491e8a', // GYD
    ];
    // BAL = 5 USD -> 200 BAL = 1000 USD
    // GNO = 350 USD -> 30 GNO = 1050 USD
    // WETH = 3500 USD -> 3 WETH = 1050 USD

    const amounts = [
        200, // BAL
        0.3, // WETH
        0.3, // wstETH
        0.3, // rETH
        1000, // DAI
        3, // GNO
        1000, // GYD
    ];

    const scaling = [10];

    for (const i in tokens) {
        for (const o in tokens) {
            if (i === o) continue;
            for (const scale of scaling) {
                const result = await sorService.getSorSwapPaths({
                    chain,
                    swapAmount: (amounts[i] * scale).toString(),
                    swapType: 'EXACT_IN',
                    tokenIn: tokens[i],
                    tokenOut: tokens[o],
                });
            }
        }
    }
}

debugScript()
    .then(() => {
        console.log('done');
    })
    .catch((error) => {
        console.log('error', error);
    });
