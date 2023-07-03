import { copperProxyService, CopperProxyService } from '../copper/copper-proxy.service';
import { getAddress, parseUnits } from 'ethers/lib/utils';
import { gnosisSafeService, GnosisSafeService } from '../gnosis/gnosis-safe.service';
import moment from 'moment';
import { prisma } from '../../prisma/prisma-client';
import { tokenService } from '../token/token.service';
import { isSameAddress } from '@balancer-labs/sdk';
import { getContractAt } from '../web3/contract';
import VaultAbi from '../pool/abi/Vault.json';
import ERC20Abi from '../web3/abi/ERC20.json';
import { networkContext } from '../network/network-context.service';
import { blocksSubgraphService } from '../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { formatFixed } from '@ethersproject/bignumber';

export type LiquidityGenerationCreateInput = {
    id: string;
    address: string;
    name: string;
    websiteUrl: string;
    tokenIconUrl: string;
    bannerImageUrl: string;
    twitterUrl: string;
    mediumUrl: string;
    discordUrl: string;
    telegramUrl: string;
    description: string;
    startTimestamp: number;
    endTimestamp: number;
    tokenAddress: string;
    tokenAmount: string;
    tokenEndWeight: number;
    tokenStartWeight: number;
    collateralAddress: string;
    collateralAmount: string;
    collateralStartWeight: number;
    collateralEndWeight: number;
    swapFee: string;
};

export type LiquidityGenerationEvent = {
    id: string;
    address: string;
    name: string;
    websiteUrl: string;
    tokenIconUrl: string;
    bannerImageUrl: string;
    twitterUrl: string;
    mediumUrl: string;
    discordUrl: string;
    telegramUrl: string;
    description: string;
    startTimestamp: number;
    endTimestamp: number;
    tokenAddress: string;
    tokenDecimals: number;
    tokenAmount: string;
    tokenStartWeight: number;
    tokenEndWeight: number;
    collateralAddress: string;
    collateralDecimals: number;
    collateralAmount: string;
    collateralStartWeight: number;
    collateralEndWeight: number;
    swapFee: string;
    adminAddress: string;
    adminIsMultisig: boolean;
};

export type PriceData = {
    price: number;
    timestamp: number;
    type: 'REAL' | 'PREDICTED';
};

export class LiquidityGenerationEventService {
    constructor(
        private readonly gnosisSafeService: GnosisSafeService,
        private readonly copperProxyService: CopperProxyService,
    ) {}

    // predict 24 data points per default
    readonly PREDICTION_TIME_STEP = 24;

    public async upsertLiquidityGenerationEvent(
        input: LiquidityGenerationCreateInput,
    ): Promise<LiquidityGenerationEvent> {
        const poolOwner = await this.copperProxyService.getLbpPoolOwner(getAddress(input.address));
        const adminIsMultisig = await this.gnosisSafeService.isAddressGnosisSafe(getAddress(poolOwner));

        const tokenContract = getContractAt(input.tokenAddress, ERC20Abi);
        const tokenDecimals = await tokenContract.decimals();

        const collateralContract = getContractAt(input.collateralAddress, ERC20Abi);
        const collateralDecimals = await collateralContract.decimals();
        await prisma.prismaLge.upsert({
            where: { id_chain: { id: input.id, chain: networkContext.chain } },
            create: {
                id: input.id,
                chain: networkContext.chain,
                address: input.address,
                name: input.name,
                websiteUrl: input.websiteUrl,
                tokenIconUrl: input.tokenIconUrl,
                bannerImageUrl: input.bannerImageUrl,
                twitterUrl: input.twitterUrl,
                mediumUrl: input.mediumUrl,
                discordUrl: input.discordUrl,
                telegramUrl: input.telegramUrl,
                description: input.description,
                startTimestamp: input.startTimestamp,
                endTimestamp: input.endTimestamp,
                tokenAddress: input.tokenAddress.toLowerCase(),
                tokenDecimals: tokenDecimals,
                tokenAmount: input.tokenAmount,
                tokenStartWeight: input.tokenStartWeight,
                tokenEndWeight: input.tokenEndWeight,
                collateralAddress: input.collateralAddress.toLowerCase(),
                collateralDecimals: collateralDecimals,
                collateralAmount: input.collateralAmount,
                collateralStartWeight: input.collateralStartWeight,
                collateralEndWeight: input.collateralEndWeight,
                swapFee: input.swapFee,
                adminAddress: poolOwner,
                adminIsMultisig,
            },
            update: {
                id: input.id,
                chain: networkContext.chain,
                address: input.address,
                name: input.name,
                websiteUrl: input.websiteUrl,
                tokenIconUrl: input.tokenIconUrl,
                bannerImageUrl: input.bannerImageUrl,
                twitterUrl: input.twitterUrl,
                mediumUrl: input.mediumUrl,
                discordUrl: input.discordUrl,
                telegramUrl: input.telegramUrl,
                description: input.description,
                startTimestamp: input.startTimestamp,
                endTimestamp: input.endTimestamp,
                tokenAddress: input.tokenAddress.toLowerCase(),
                tokenDecimals: tokenDecimals,
                tokenAmount: input.tokenAmount,
                tokenStartWeight: input.tokenStartWeight,
                tokenEndWeight: input.tokenEndWeight,
                collateralAddress: input.collateralAddress.toLowerCase(),
                collateralDecimals: collateralDecimals,
                collateralAmount: input.collateralAmount,
                collateralStartWeight: input.collateralStartWeight,
                collateralEndWeight: input.collateralEndWeight,
                swapFee: input.swapFee,
                adminAddress: poolOwner,
                adminIsMultisig,
            },
        });

        return prisma.prismaLge.findUniqueOrThrow({
            where: { id_chain: { id: input.id, chain: networkContext.chain } },
        });
    }

    public async getLges(): Promise<LiquidityGenerationEvent[]> {
        return prisma.prismaLge.findMany();
    }

    public async getLiquidityGenerationEvent(id: string): Promise<LiquidityGenerationEvent> {
        return prisma.prismaLge.findUniqueOrThrow({
            where: { id_chain: { id: id, chain: networkContext.chain } },
        });
    }

    public async getLgeChartData(id: string): Promise<PriceData[]> {
        const lge = await this.getLiquidityGenerationEvent(id);
        const now = moment().unix();
        const hasEnded = now > lge.endTimestamp;
        const hasStarted = now >= lge.startTimestamp;

        let realPriceData: PriceData[] = [];
        let predictedPriceData: PriceData[] = [];
        if (hasStarted) {
            realPriceData = await this.getLgeRealPriceData(lge);
        }
        if (!hasEnded) {
            predictedPriceData = await this.getLgeChartPredictedPriceData(lge);
        }
        return [...realPriceData, ...predictedPriceData];
    }

    /*
    For each running LGE, this method persists the real price for the launch token. It uses two methods for this:
    1) If there were no swaps since it was called previously, it will persist one real price using the previous token balances (since they didn't change), 
       current token weights as well as the current collateral price from the DB (coingecko).
    2) If there were swaps on the pool, it will get the persist one real price for each swap that happened. It will use the token balances and token weights 
       at the blocknumber of the swap, and the current collateral price from the DB (coingecko).

    Please note: Since it uses current pricing for the collateral, this method should be called regularly in short intervalls to make sure that heavy price movements
    of the collateral token are captured. In addition, it should also be called regularly to create a "real-time" user experience.
    */
    public async syncRunningLgeRealPriceData() {
        const now = moment().unix();
        const lges = await this.getLges();
        for (const lge of lges) {
            if (now >= lge.startTimestamp && now <= lge.endTimestamp) {
                this.syncRealPriceDataForLge(lge);
            } else {
                const twoDaysAgo = moment().subtract(2, 'day').unix();
                await prisma.prismaPoolSwap.deleteMany({
                    where: {
                        timestamp: { lt: twoDaysAgo },
                        pool: { address: lge.address, chain: networkContext.chain },
                        chain: networkContext.chain,
                    },
                });
            }
        }
    }

    public async syncRealPriceDataForLge(lge: LiquidityGenerationEvent): Promise<void> {
        const tokenPrices = await tokenService.getTokenPrices();
        const latestPriceData = await prisma.prismaLgePriceData.findMany({
            where: { id: lge.id },
            orderBy: { timestamp: 'desc' },
        });

        const collateralTokenPrice = tokenService.getPriceForToken(tokenPrices, lge.collateralAddress);
        if (latestPriceData.length === 0) {
            //make sure we have the very first price data in the db as a manual entry
            const tokenPrice = this.calculateLbpTokenPrice(
                lge.tokenStartWeight,
                lge.collateralStartWeight,
                lge.tokenAmount,
                lge.tokenDecimals,
                lge.collateralAmount,
                lge.collateralDecimals,
                collateralTokenPrice,
            );
            const lgeStartBlockNumber = await blocksSubgraphService.getBlockForTimestamp(lge.startTimestamp);
            await prisma.prismaLgePriceData.create({
                data: {
                    id: lge.id,
                    chain: networkContext.chain,
                    timestamp: lge.startTimestamp,
                    swapTransaction: `${lge.startTimestamp}`,
                    blockNumber: parseFloat(lgeStartBlockNumber.number),
                    launchTokenPrice: tokenPrice,
                    tokenBalance: lge.tokenAmount,
                    collateralBalance: lge.collateralAmount,
                },
            });
            latestPriceData.push((await prisma.prismaLgePriceData.findFirst())!);
        }
        const lastSyncedBlockNumber = latestPriceData[0].blockNumber;
        const latestBlockNumber = await networkContext.config.provider.getBlockNumber();

        const endBlock =
            latestBlockNumber > lastSyncedBlockNumber + networkContext.data.rpcMaxBlockRange
                ? lastSyncedBlockNumber + networkContext.data.rpcMaxBlockRange
                : latestBlockNumber;

        const vaultContract = getContractAt(networkContext.data.balancer.vault, VaultAbi);
        const filter = vaultContract.filters.Swap(lge.id);

        if (lastSyncedBlockNumber === endBlock) {
            // no new blocks have been minted since last run
            return;
        }

        console.log(`From: ${lastSyncedBlockNumber}, to: ${endBlock}`);

        const swapEvents = await vaultContract.queryFilter(filter, lastSyncedBlockNumber + 1, endBlock);

        let previousTokenBalance = latestPriceData[0].tokenBalance;
        let previousCollateralBalance = latestPriceData[0].collateralBalance;

        const previousTokenBalanceScaled = parseUnits(previousTokenBalance, lge.tokenDecimals);
        const previousCollateralBalanceScaled = parseUnits(previousCollateralBalance, lge.collateralDecimals);

        if (swapEvents.length === 0) {
            // create a manual price entry if there where no swaps so we have a data point based on previous price data balances
            const { blocks } = await blocksSubgraphService.getBlocks({
                where: { number: `${endBlock}` },
            });
            let latestSyncedBlockTimestamp = moment().utc().unix();
            if (blocks[0]) {
                latestSyncedBlockTimestamp = parseFloat(blocks[0].timestamp);
            }

            const { tokenWeight, collateralWeight } = this.getWeightsAtTime(
                latestSyncedBlockTimestamp,
                lge.tokenStartWeight,
                lge.tokenEndWeight,
                lge.collateralStartWeight,
                lge.collateralEndWeight,
                lge.startTimestamp,
                lge.endTimestamp,
            );

            const tokenPrice = this.calculateLbpTokenPrice(
                tokenWeight,
                collateralWeight,
                previousTokenBalanceScaled.toString(),
                lge.tokenDecimals,
                previousCollateralBalanceScaled.toString(),
                lge.collateralDecimals,
                collateralTokenPrice,
            );

            await prisma.prismaLgePriceData.create({
                data: {
                    id: lge.id,
                    chain: networkContext.chain,
                    timestamp: latestSyncedBlockTimestamp,
                    swapTransaction: `${latestSyncedBlockTimestamp}`,
                    blockNumber: endBlock,
                    launchTokenPrice: tokenPrice,
                    tokenBalance: previousTokenBalance,
                    collateralBalance: previousCollateralBalance,
                },
            });

            return;
        }

        for (const swapEvent of swapEvents) {
            const swapTimestamp = (await swapEvent.getBlock()).timestamp;
            const transactionHash = swapEvent.transactionHash;

            const tokenBalanceAfterSwap = isSameAddress(swapEvent.args!.tokenIn, lge.tokenAddress)
                ? previousTokenBalanceScaled.add(swapEvent.args!.amountIn)
                : previousTokenBalanceScaled.sub(swapEvent.args!.amountOut);

            const collateralBalanceAfterSwap = isSameAddress(swapEvent.args!.tokenIn, lge.collateralAddress)
                ? previousCollateralBalanceScaled.add(swapEvent.args!.amountIn)
                : previousCollateralBalanceScaled.sub(swapEvent.args!.amountOut);

            const collateralPrice = tokenService.getPriceForToken(tokenPrices, lge.collateralAddress);
            const { tokenWeight, collateralWeight } = this.getWeightsAtTime(
                swapTimestamp,
                lge.tokenStartWeight,
                lge.tokenEndWeight,
                lge.collateralStartWeight,
                lge.collateralEndWeight,
                lge.startTimestamp,
                lge.endTimestamp,
            );
            const tokenPrice = this.calculateLbpTokenPrice(
                tokenWeight,
                collateralWeight,
                tokenBalanceAfterSwap.toString(),
                lge.tokenDecimals,
                collateralBalanceAfterSwap.toString(),
                lge.collateralDecimals,
                collateralPrice,
            );

            console.log(transactionHash);
            await prisma.prismaLgePriceData.create({
                data: {
                    id: lge.id,
                    chain: networkContext.chain,
                    swapTransaction: transactionHash,
                    timestamp: swapTimestamp,
                    blockNumber: swapEvent.blockNumber,
                    launchTokenPrice: tokenPrice,
                    tokenBalance: formatFixed(tokenBalanceAfterSwap, lge.tokenDecimals),
                    collateralBalance: formatFixed(collateralBalanceAfterSwap, lge.collateralDecimals),
                },
            });
            previousTokenBalance = formatFixed(tokenBalanceAfterSwap, lge.tokenDecimals);
            previousCollateralBalance = formatFixed(collateralBalanceAfterSwap, lge.collateralDecimals);
        }
    }

    public async getLgeRealPriceData(lge: LiquidityGenerationEvent): Promise<PriceData[]> {
        const priceData = await prisma.prismaLgePriceData.findMany({ where: { id: lge.id } });
        return priceData.map((priceData) => {
            return {
                price: priceData.launchTokenPrice,
                timestamp: priceData.timestamp,
                type: 'REAL',
            };
        });
    }

    /*
    Prediction of the price is fairly simple. We use the current collateral price, the current token balances and the changing token weights.
    The number of data points we predict is static set to PREDICTION_TIME_STEP but enforces a minimum of 1 data point per 12 hours and a maximum of
    1 datapoint per second.
    */
    private async getLgeChartPredictedPriceData(lge: LiquidityGenerationEvent): Promise<PriceData[]> {
        const now = moment().unix();
        const hasStarted = now > lge.startTimestamp;
        const firstPredictionTimestamp = hasStarted ? now : lge.startTimestamp;
        const secondsRemaining = lge.endTimestamp - firstPredictionTimestamp;
        const TWELVE_HOURS_IN_SECONDS = 43200;

        let predictionInterval = Math.floor(secondsRemaining / this.PREDICTION_TIME_STEP);
        if (predictionInterval === 0) {
            predictionInterval = 1;
        }
        if (predictionInterval > TWELVE_HOURS_IN_SECONDS) {
            predictionInterval = TWELVE_HOURS_IN_SECONDS;
        }
        // for the prediction, we use the current token price of the collateral token as well as the current token balances
        const { collateralBalance, tokenBalance } = await this.getCurrentPoolTokenBalances(lge);
        const tokenPrices = await tokenService.getTokenPrices();
        const collateralTokenPrice = tokenService.getPriceForToken(tokenPrices, lge.collateralAddress);

        let { tokenWeight, collateralWeight } = this.getWeightsAtTime(
            firstPredictionTimestamp,
            lge.tokenStartWeight,
            lge.tokenEndWeight,
            lge.collateralStartWeight,
            lge.collateralEndWeight,
            lge.startTimestamp,
            lge.endTimestamp,
        );

        const priceData: PriceData[] = [];
        priceData.push({
            price: this.calculateLbpTokenPrice(
                tokenWeight,
                collateralWeight,
                parseUnits(tokenBalance, lge.tokenDecimals).toString(),
                lge.tokenDecimals,
                parseUnits(collateralBalance, lge.collateralDecimals).toString(),
                lge.collateralDecimals,
                collateralTokenPrice,
            ),
            timestamp: firstPredictionTimestamp,
            type: 'PREDICTED',
        });
        let timestamp = firstPredictionTimestamp;

        while (timestamp + predictionInterval < lge.endTimestamp) {
            timestamp = timestamp + predictionInterval;
            let { tokenWeight, collateralWeight } = this.getWeightsAtTime(
                timestamp,
                lge.tokenStartWeight,
                lge.tokenEndWeight,
                lge.collateralStartWeight,
                lge.collateralEndWeight,
                lge.startTimestamp,
                lge.endTimestamp,
            );

            const tokenPrice = this.calculateLbpTokenPrice(
                tokenWeight,
                collateralWeight,
                parseUnits(tokenBalance, lge.tokenDecimals).toString(),
                lge.tokenDecimals,
                parseUnits(collateralBalance, lge.collateralDecimals).toString(),
                lge.collateralDecimals,
                collateralTokenPrice,
            );

            priceData.push({
                price: tokenPrice,
                timestamp: timestamp,
                type: 'PREDICTED',
            });
        }

        priceData.push({
            price: this.calculateLbpTokenPrice(
                lge.tokenEndWeight,
                lge.collateralEndWeight,
                parseUnits(tokenBalance, lge.tokenDecimals).toString(),
                lge.tokenDecimals,
                parseUnits(collateralBalance, lge.collateralDecimals).toString(),
                lge.collateralDecimals,
                collateralTokenPrice,
            ),
            timestamp: lge.endTimestamp,
            type: 'PREDICTED',
        });

        return priceData;
    }

    private async getCurrentPoolTokenBalances(lge: LiquidityGenerationEvent) {
        const poolTokens = await prisma.prismaPoolToken.findMany({
            where: { poolId: lge.id },
            include: { dynamicData: true },
        });

        let tokenBalance = lge.tokenAmount;
        let collateralBalance = lge.collateralAmount;
        for (const poolToken of poolTokens) {
            if (isSameAddress(poolToken.address, lge.tokenAddress)) {
                if (poolToken.dynamicData) {
                    tokenBalance = poolToken.dynamicData.balance;
                }
            }
            if (isSameAddress(poolToken.address, lge.collateralAddress)) {
                if (poolToken.dynamicData) {
                    collateralBalance = poolToken.dynamicData.balance;
                }
            }
        }
        return { collateralBalance, tokenBalance };
    }

    private getWeightsAtTime(
        timestamp: number,
        tokenStartWeight: number,
        tokenEndWeight: number,
        collateralStartWeight: number,
        collateralEndWeight: number,
        startTimestamp: number,
        endTimestamp: number,
    ): { tokenWeight: number; collateralWeight: number } {
        const percentComplete = (timestamp - startTimestamp) / (endTimestamp - startTimestamp);

        const tokenWeight = tokenStartWeight - (tokenStartWeight - tokenEndWeight) * percentComplete;
        const collateralWeight =
            collateralStartWeight - (collateralStartWeight - collateralEndWeight) * percentComplete;

        return { tokenWeight, collateralWeight };
    }

    private calculateLbpTokenPrice(
        tokenWeight: number,
        collateralWeight: number,
        scaledTokenBalance: string,
        tokenDecimals: number,
        scaledCollateralBalance: string,
        collateralDecimals: number,
        collateralTokenPrice: number,
    ): number {
        const tokenBalance = formatFixed(scaledTokenBalance, tokenDecimals);
        const collateralBalance = formatFixed(scaledCollateralBalance, collateralDecimals);

        return (
            (((tokenWeight / collateralWeight) * parseFloat(collateralBalance)) / parseFloat(tokenBalance)) *
            collateralTokenPrice
        );
    }
}

export const liquidityGenerationEventService = new LiquidityGenerationEventService(
    gnosisSafeService,
    copperProxyService,
);
