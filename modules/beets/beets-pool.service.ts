import { GqlBeetsUserPoolData } from '../../schema';
import { beetsFarmService } from './beets-farm.service';
import { balancerService } from '../balancer/balancer.service';
import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { BigNumber } from 'ethers';
import { tokenPriceService } from '../token-price/token-price.service';
import { getAddress } from '@ethersproject/address';
import { addressesMatch } from '../util/addresses';
import _ from 'lodash';
import { env } from '../../app/env';
import { beetsBarService } from '../beets-bar-subgraph/beets-bar.service';
import { getUserFBeetsInWalletBalance } from './beets';

export class BeetsPoolService {
    public async getUserPoolData(userAddress: string): Promise<GqlBeetsUserPoolData[]> {
        const pools = await balancerService.getPools();
        const userFarms = await beetsFarmService.getBeetsFarmsForUser(userAddress);
        const balancerUser = await balancerSubgraphService.getUser(userAddress);
        const sharesOwned = balancerUser?.sharesOwned || [];
        const tokenPrices = await tokenPriceService.getTokenPrices();
        const beetsBar = await beetsBarService.getBeetsBarNow();

        const data: GqlBeetsUserPoolData[] = [];

        for (const pool of pools) {
            let balanceScaled = BigNumber.from(0);

            const userFarm = userFarms.find((userFarm) => addressesMatch(userFarm.pair, pool.address));
            const shares = sharesOwned.find((shares) => shares.poolId.id === pool.id);

            if (userFarm) {
                balanceScaled = balanceScaled.add(userFarm.amount);
            }

            if (shares && shares.balance !== '0') {
                balanceScaled = balanceScaled.add(parseFixed(shares.balance, 18));
            }

            if (pool.id === env.FBEETS_POOL_ID) {
                const userFBeetsFarm = userFarms.find((userFarm) => addressesMatch(userFarm.pair, env.FBEETS_ADDRESS));
                const fBeetsInWallet = await getUserFBeetsInWalletBalance(userAddress);
                const fBeetsInFarm = userFBeetsFarm?.amount || '0';
                const totalFBeets = BigNumber.from(fBeetsInWallet).add(fBeetsInFarm);
                //stored precision is massive, we truncate it
                const fBeetsRatio = parseFixed(beetsBar.ratio.slice(0, beetsBar.ratio.indexOf('.') + 19), 18);
                const underlyingBpt = totalFBeets.mul(fBeetsRatio).div(BigNumber.from(10).pow(18));

                balanceScaled = balanceScaled.add(underlyingBpt);
            }

            if (balanceScaled.gt(0)) {
                const balance = formatFixed(balanceScaled.toString(), 18).toString();
                const userShareOfPool = parseFloat(balance) / parseFloat(pool.totalShares);
                const tokens = pool.tokens.map((token) => {
                    const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, token.address);
                    const balance = parseFloat(token.balance) * userShareOfPool;

                    return {
                        address: getAddress(token.address),
                        symbol: token.symbol,
                        balance: `${balance}`,
                        balanceUSD: `${balance * tokenPrice}`,
                    };
                });

                data.push({
                    poolId: pool.id,
                    balance,
                    balanceScaled: balanceScaled.toString(),
                    balanceUSD: `${_.sumBy(tokens, (token) => parseFloat(token.balanceUSD))}`,
                    tokens,
                    mainTokens: pool.mainTokens?.map((mainToken) => {
                        const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, mainToken);
                        const linearPool = pool.linearPools?.find((linearPool) =>
                            addressesMatch(linearPool.mainToken.address, mainToken),
                        );

                        if (linearPool) {
                            const balance = parseFloat(linearPool.mainTokenTotalBalance) * userShareOfPool;

                            return {
                                address: getAddress(mainToken),
                                symbol: linearPool.mainToken.symbol,
                                balance: `${balance}`,
                                balanceUSD: `${balance * tokenPrice}`,
                            };
                        }

                        const token = pool.tokens.find((token) => addressesMatch(token.address, mainToken));

                        if (token) {
                            const balance = parseFloat(token.balance) * userShareOfPool;
                            return {
                                address: getAddress(mainToken),
                                symbol: token.symbol,
                                balance: `${balance}`,
                                balanceUSD: `${balance * tokenPrice}`,
                            };
                        }

                        //TODO: shouldn't really happen, but throwing an error could cause some unintended side effects in the future
                        return {
                            address: '',
                            symbol: '',
                            balance: '',
                            balanceUSD: '',
                        };
                    }),
                });
            }
        }

        return data;
    }
}

export const beetsPoolService = new BeetsPoolService();
