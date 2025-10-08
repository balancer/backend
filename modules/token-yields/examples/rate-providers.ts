import { Chain } from '@prisma/client';
import { rateProviderHandler } from '../handlers/sources/rate-provider-handler';
import { TokenYieldAprHandlers } from '../handlers';
import cnfg from '../../../config';
import { prisma } from '../../../prisma/prisma-client';

const main = async (chain: Chain, intervals: number[]) => {
    const tokens = await prisma.prismaToken.findMany({
        where: {
            chain,
        },
        select: { address: true, name: true, symbol: true, underlyingTokenAddress: true },
    });
    const underlyingMap = new Map(tokens.map((t) => [t.address, t.underlyingTokenAddress]));
    const nameMap = new Map(tokens.map((t) => [t.address, t.name]));
    const symbolMap = new Map(tokens.map((t) => [t.address, t.symbol]));

    const config = cnfg[chain].aprHandlers.ybAprHandler;
    const handler = new TokenYieldAprHandlers(config!, chain);
    const ybAprs = await handler.fetchAprsFromAllHandlers().then((rs) => new Map(rs.map((r) => [r.address, r.apr])));

    const data = await Promise.all(
        intervals.flatMap((intervalInDays) =>
            rateProviderHandler({ chain, intervalInDays }).then((results) =>
                results.map((item) => {
                    const referenceApr = ybAprs.get(item.address) || 0;
                    const address = item.address;
                    const rateApr = item.apr;
                    const underlyingApr = ybAprs.get(underlyingMap.get(item.address) || '');
                    const name = nameMap.get(item.address) || '';
                    const symbol = symbolMap.get(item.address) || '';
                    const diff = Math.abs(referenceApr - rateApr);

                    return {
                        intervalInDays,
                        address,
                        name,
                        symbol,
                        referenceApr,
                        underlyingApr,
                        rateApr,
                        diff: referenceApr > 0 ? (100 * diff) / referenceApr : NaN,
                        priceRateProvider: (item as any).priceRateProvider,
                    };
                }),
            ),
        ),
    );

    return JSON.stringify(data.flat());

    // // const deviations = Object.values(data).map((item) => {
    // //     const aprs = item.aprs;
    // //     const mean = aprs.reduce((a, b) => a + b, 0) / aprs.length;
    // //     const variance = aprs.map((apr) => (apr - mean) ** 2).reduce((a, b) => a + b, 0) / aprs.length;
    // //     const deviation = Math.sqrt(variance);

    // //     return {
    // //         token: item.address,
    // //         deviation,
    // //         priceRateProvider: item.priceRateProvider,
    // //     };
    // // });

    // deviations.sort((a, b) => b.deviation - a.deviation);

    // console.log(JSON.stringify(deviations, null, 2));
};

main(
    process.argv[2] as Chain,
    process.argv[3].split(',').map((i) => parseInt(i)),
)
    .then(console.log)
    .catch(console.log)
    .finally(() => process.exit(0));
