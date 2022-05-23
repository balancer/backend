import { GqlBeetsUserPoolData, GqlBeetsUserPoolPoolData } from '../../schema';
import { balancerService } from '../balancer/balancer.service';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { BigNumber } from 'ethers';
import { tokenPriceService } from '../token-price/token-price.service';
import { getAddress } from '@ethersproject/address';
import { addressesMatch } from '../util/addresses';
import _ from 'lodash';

export class BeetsPoolService {
    public async getUserPoolData(userAddress: string): Promise<GqlBeetsUserPoolData> {
        const pools = await balancerService.getPools();
        const sharesOwned = await balancerService.getUserPoolShares(userAddress);
        const tokenPrices = await tokenPriceService.getTokenPrices();

        const data: GqlBeetsUserPoolPoolData[] = [];

        for (const pool of pools) {
            let balanceScaled = BigNumber.from(0);
            const shares = sharesOwned.find((shares) => shares.poolAddress === pool.address);
            const hasUnstakedBpt = shares && parseFloat(shares.balance) > 0;

            if (shares && shares.balance !== '0') {
                balanceScaled = balanceScaled.add(parseFixed(shares.balance, 18));
            }

            if (balanceScaled.gt(0)) {
                const balance = formatFixed(balanceScaled.toString(), 18).toString();
                const userShareOfPool = parseFloat(balance) / parseFloat(pool.totalShares);
                const userFarmShareOfPool = 0;
                const tokens = pool.tokens
                    .filter((token) => token.address !== pool.address)
                    .map((token) => {
                        const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, token.address);
                        const balance = parseFloat(token.balance) * userShareOfPool;
                        const farmBalance = parseFloat(token.balance) * userFarmShareOfPool;

                        return {
                            address: getAddress(token.address),
                            symbol: token.symbol,
                            balance: `${balance}`,
                            balanceUSD: `${balance * tokenPrice}`,
                            farmBalanceUSD: `${farmBalance * tokenPrice}`,
                        };
                    });

                data.push({
                    poolId: pool.id,
                    balance,
                    balanceScaled: balanceScaled.toString(),
                    balanceUSD: `${_.sumBy(tokens, (token) => parseFloat(token.balanceUSD))}`,
                    farmBalanceUSD: `${_.sumBy(tokens, (token) => parseFloat(token.farmBalanceUSD))}`,
                    hasUnstakedBpt,
                    tokens,
                    mainTokens: pool.mainTokens?.map((mainToken) => {
                        const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, mainToken);
                        const linearPool = pool.linearPools?.find((linearPool) =>
                            addressesMatch(linearPool.mainToken.address, mainToken),
                        );

                        if (linearPool) {
                            const balance = parseFloat(linearPool.mainTokenTotalBalance) * userShareOfPool;
                            const farmBalance = parseFloat(linearPool.mainTokenTotalBalance) * userFarmShareOfPool;

                            return {
                                address: getAddress(mainToken),
                                symbol: linearPool.mainToken.symbol,
                                balance: `${balance}`,
                                balanceUSD: `${balance * tokenPrice}`,
                                farmBalanceUSD: `${farmBalance * tokenPrice}`,
                            };
                        }

                        const token = pool.tokens.find((token) => addressesMatch(token.address, mainToken));

                        if (token) {
                            const balance = parseFloat(token.balance) * userShareOfPool;
                            const farmBalance = parseFloat(token.balance) * userFarmShareOfPool;

                            return {
                                address: getAddress(mainToken),
                                symbol: token.symbol,
                                balance: `${balance}`,
                                balanceUSD: `${balance * tokenPrice}`,
                                farmBalanceUSD: `${farmBalance * tokenPrice}`,
                            };
                        }

                        //TODO: shouldn't really happen, but throwing an error could cause some unintended side effects in the future
                        return {
                            address: '',
                            symbol: '',
                            balance: '',
                            balanceUSD: '',
                            farmBalanceUSD: '',
                        };
                    }),
                });
            }
        }

        const nonLinearPools = pools.filter((pool) => pool.poolType !== 'Linear');
        const totalBalanceUSD = _.sumBy(data, (pool) => parseFloat(pool.balanceUSD));
        const totalFarmBalanceUSD = _.sumBy(data, (pool) => parseFloat(pool.farmBalanceUSD));
        const averageApr = _.sum(
            data.map((item) => {
                const pool = nonLinearPools.find((pool) => pool.id === item.poolId);

                if (!pool) {
                    return 0;
                }

                return parseFloat(pool.apr.total) * (parseFloat(item.balanceUSD) / totalBalanceUSD);
            }),
        );

        const averageFarmApr = _.sum(
            data.map((item) => {
                const pool = nonLinearPools.find((pool) => pool.id === item.poolId);

                if (!pool) {
                    return 0;
                }

                return (
                    (parseFloat(pool.apr.beetsApr) + parseFloat(pool.apr.thirdPartyApr)) *
                    (parseFloat(item.farmBalanceUSD) / totalFarmBalanceUSD)
                );
            }),
        );

        return {
            pools: data,
            totalBalanceUSD: `${totalBalanceUSD}`,
            averageApr: `${averageApr}`,
            totalFarmBalanceUSD: `${totalFarmBalanceUSD}`,
            averageFarmApr: `${averageFarmApr}`,
        };
    }
}

export const beetsPoolService = new BeetsPoolService();
