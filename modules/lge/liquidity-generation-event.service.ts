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
import { getSanityClient } from '../content/sanity-content.service';
import { balancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { BigNumber } from 'ethers';
import { PrismaTokenCurrentPrice } from '@prisma/client';

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
    tokenSymbol: string;
    tokenAmount: string;
    tokenStartWeight: number;
    tokenEndWeight: number;
    collateralAddress: string;
    collateralDecimals: number;
    collateralSymbol: string;
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
        const tokenSymbol = await tokenContract.symbol();

        const collateralContract = getContractAt(input.collateralAddress, ERC20Abi);
        const collateralDecimals = await collateralContract.decimals();
        const collateralSymbol = await collateralContract.symbol();
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
                tokenSymbol: tokenSymbol,
                tokenAmount: input.tokenAmount,
                tokenStartWeight: input.tokenStartWeight,
                tokenEndWeight: input.tokenEndWeight,
                collateralAddress: input.collateralAddress.toLowerCase(),
                collateralDecimals: collateralDecimals,
                collateralSymbol: collateralSymbol,
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
                tokenSymbol: tokenSymbol,
                tokenAmount: input.tokenAmount,
                tokenStartWeight: input.tokenStartWeight,
                tokenEndWeight: input.tokenEndWeight,
                collateralAddress: input.collateralAddress.toLowerCase(),
                collateralDecimals: collateralDecimals,
                collateralSymbol: collateralSymbol,
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

    // TODO remove after successful migration
    public async syncLgesFromSanity(): Promise<void> {
        type LiquidityGenerationEvent = {
            id: string;
            address: string;
            name: string;
            description: string;
            tokenContractAddress: string;
            collateralTokenAddress: string;
            tokenAmount: string;
            collateralAmount: string;
            tokenStartWeight: number;
            collateralStartWeight: number;
            tokenEndWeight: number;
            collateralEndWeight: number;
            swapFeePercentage: string;
            websiteUrl: string;
            tokenIconUrl: string;
            twitterUrl: string;
            mediumUrl: string;
            discordUrl: string;
            telegramUrl: string;
            startDate: string;
            endDate: string;
            bannerImageUrl: string;
            adminAddress: string;
            adminIsMultisig: boolean;
        };

        const lges: LiquidityGenerationEvent[] = await getSanityClient().fetch(
            `*[_type == "lbp" && chainId == "${networkContext.chainId}"]`,
        );

        for (const lge of lges) {
            await liquidityGenerationEventService.upsertLiquidityGenerationEvent({
                address: lge.address,
                bannerImageUrl: lge.bannerImageUrl,
                collateralAddress: lge.collateralTokenAddress,
                collateralAmount: lge.collateralAmount,
                collateralEndWeight: lge.collateralEndWeight,
                collateralStartWeight: lge.collateralStartWeight,
                description: lge.description,
                discordUrl: lge.discordUrl,
                endTimestamp: moment(lge.endDate).unix(),
                id: lge.id,
                mediumUrl: lge.mediumUrl,
                name: lge.name,
                startTimestamp: moment(lge.startDate).unix(),
                swapFee: lge.swapFeePercentage,
                telegramUrl: lge.telegramUrl,
                tokenAddress: lge.tokenContractAddress,
                tokenAmount: lge.tokenAmount,
                tokenEndWeight: lge.tokenEndWeight,
                tokenIconUrl: lge.tokenIconUrl,
                tokenStartWeight: lge.tokenStartWeight,
                twitterUrl: lge.twitterUrl,
                websiteUrl: lge.websiteUrl,
            });
        }
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
                await this.syncRealPriceDataForLge(lge);
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
        let latestPriceData = await prisma.prismaLgePriceData.findFirst({
            where: { id: lge.id, chain: networkContext.chain },
            orderBy: { timestamp: 'desc' },
        });

        const collateralTokenPrice = tokenService.getPriceForToken(tokenPrices, lge.collateralAddress);

        // we need the initial price data from the initial token and collateral balances persisted to be able to construct balances after swaps
        // it will also take care of any swaps that happened before the official startTimestamp
        if (!latestPriceData) {
            await this.createInitialPriceData(lge, collateralTokenPrice, tokenPrices);
            latestPriceData = latestPriceData = await prisma.prismaLgePriceData.findFirst({
                where: { id: lge.id, chain: networkContext.chain },
                orderBy: { timestamp: 'desc' },
            });
        }

        const lastSyncedBlockNumber = latestPriceData!.blockNumber;
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

        console.log(`From: ${lastSyncedBlockNumber + 1}, to: ${endBlock}`);

        const swapEvents = await vaultContract.queryFilter(filter, lastSyncedBlockNumber + 1, endBlock);

        const previousTokenBalance = latestPriceData!.tokenBalance;
        const previousCollateralBalance = latestPriceData!.collateralBalance;

        let previousTokenBalanceScaled = parseUnits(previousTokenBalance, lge.tokenDecimals);
        let previousCollateralBalanceScaled = parseUnits(previousCollateralBalance, lge.collateralDecimals);

        if (swapEvents.length === 0) {
            // create a manual price entry if there where no swaps so we have a data point based on previous price data balances
            await this.createManualPriceEntryForBlock(
                endBlock,
                lge,
                previousTokenBalanceScaled,
                previousCollateralBalanceScaled,
                collateralTokenPrice,
            );
        } else {
            const swaps = [];
            for (const swapEvent of swapEvents) {
                swaps.push({
                    timestamp: (await swapEvent.getBlock()).timestamp,
                    blockNumber: swapEvent.blockNumber,
                    transactionHash: swapEvent.transactionHash,
                    tokenIn: swapEvent.args!.tokenIn,
                    tokenOut: swapEvent.args!.tokenOut,
                    tokenAmountIn: isSameAddress(swapEvent.args!.tokenIn, lge.tokenAddress)
                        ? formatFixed(swapEvent.args!.amountIn, lge.tokenDecimals)
                        : formatFixed(swapEvent.args!.amountIn, lge.collateralDecimals),
                    tokenAmountOut: isSameAddress(swapEvent.args!.tokenOut, lge.tokenAddress)
                        ? formatFixed(swapEvent.args!.amountOut, lge.tokenDecimals)
                        : formatFixed(swapEvent.args!.amountOut, lge.collateralDecimals),
                });
            }

            await this.createPriceDataFromSwaps(
                swaps,
                lge,
                previousTokenBalanceScaled,
                previousCollateralBalanceScaled,
                tokenPrices,
            );
        }
    }

    private async createPriceDataFromSwaps(
        swaps: {
            timestamp: number;
            blockNumber: number;
            transactionHash: string;
            tokenIn: string;
            tokenOut: string;
            tokenAmountIn: string;
            tokenAmountOut: string;
        }[],
        lge: LiquidityGenerationEvent,
        currentTokenBalanceScaled: BigNumber,
        currentCollateralBalanceScaled: BigNumber,
        tokenPrices: PrismaTokenCurrentPrice[],
    ) {
        let previousTokenBalanceScaled = currentTokenBalanceScaled;
        let previousCollateralBalanceScaled = currentCollateralBalanceScaled;

        for (const swap of swaps) {
            const tokenAmountInScaled = isSameAddress(swap.tokenIn, lge.tokenAddress)
                ? parseUnits(swap.tokenAmountIn, lge.tokenDecimals)
                : parseUnits(swap.tokenAmountIn, lge.collateralDecimals);

            const tokenAmountOutScaled = isSameAddress(swap.tokenOut, lge.tokenAddress)
                ? parseUnits(swap.tokenAmountOut, lge.tokenDecimals)
                : parseUnits(swap.tokenAmountOut, lge.collateralDecimals);

            const tokenBalanceAfterSwap = isSameAddress(swap.tokenIn, lge.tokenAddress)
                ? previousTokenBalanceScaled.add(tokenAmountInScaled)
                : previousTokenBalanceScaled.sub(tokenAmountOutScaled);

            const collateralBalanceAfterSwap = isSameAddress(swap.tokenIn, lge.collateralAddress)
                ? previousCollateralBalanceScaled.add(tokenAmountInScaled)
                : previousCollateralBalanceScaled.sub(tokenAmountOutScaled);

            const collateralPrice = tokenService.getPriceForToken(tokenPrices, lge.collateralAddress);
            const { tokenWeight, collateralWeight } = this.getWeightsAtTime(
                swap.timestamp,
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

            await prisma.prismaLgePriceData.create({
                data: {
                    id: lge.id,
                    chain: networkContext.chain,
                    swapTransaction: swap.transactionHash,
                    timestamp: swap.timestamp,
                    blockNumber: swap.blockNumber,
                    launchTokenPrice: tokenPrice,
                    tokenBalance: formatFixed(tokenBalanceAfterSwap, lge.tokenDecimals),
                    collateralBalance: formatFixed(collateralBalanceAfterSwap, lge.collateralDecimals),
                },
            });
            previousCollateralBalanceScaled = collateralBalanceAfterSwap;
            previousTokenBalanceScaled = tokenBalanceAfterSwap;
        }
    }

    private async createManualPriceEntryForBlock(
        block: number,
        lge: LiquidityGenerationEvent,
        previousTokenBalanceScaled: BigNumber,
        previousCollateralBalanceScaled: BigNumber,
        collateralTokenPrice: number,
    ) {
        const { blocks } = await blocksSubgraphService.getBlocks({
            where: { number: `${block}` },
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
                blockNumber: block,
                launchTokenPrice: tokenPrice,
                tokenBalance: formatFixed(previousTokenBalanceScaled, lge.tokenDecimals),
                collateralBalance: formatFixed(previousCollateralBalanceScaled, lge.collateralDecimals),
            },
        });
    }

    private async createInitialPriceData(
        lge: LiquidityGenerationEvent,
        collateralTokenPrice: number,
        tokenPrices: PrismaTokenCurrentPrice[],
    ) {
        const tokenPrice = this.calculateLbpTokenPrice(
            lge.tokenStartWeight,
            lge.collateralStartWeight,
            lge.tokenAmount,
            lge.tokenDecimals,
            lge.collateralAmount,
            lge.collateralDecimals,
            collateralTokenPrice,
        );

        // find any swaps that already happened prior to the startTimestamp (pools can enable swap any time)
        const subgraphSwaps = await balancerSubgraphService.getAllSwapsWithPaging({
            where: { poolId: lge.id, timestamp_lt: lge.startTimestamp },
            startTimestamp: 0,
        });

        let initialSwapTimestamp = lge.startTimestamp;
        let initialBlockNumber = await blocksSubgraphService.getBlockForTimestamp(lge.startTimestamp);

        // if we already have swaps prior to the official start timestamp, we need to adapt the timestamp of the initial price data prior to the first swap
        if (subgraphSwaps.length > 0) {
            initialSwapTimestamp = subgraphSwaps[0].timestamp - 1;
            initialBlockNumber = await blocksSubgraphService.getBlockForTimestamp(initialSwapTimestamp);
        }

        // we push the initial price data
        await prisma.prismaLgePriceData.create({
            data: {
                id: lge.id,
                chain: networkContext.chain,
                timestamp: initialSwapTimestamp,
                swapTransaction: `${initialSwapTimestamp}`,
                blockNumber: parseFloat(initialBlockNumber.number) - 1,
                launchTokenPrice: tokenPrice,
                tokenBalance: lge.tokenAmount,
                collateralBalance: lge.collateralAmount,
            },
        });

        // process swaps
        const currentTokenBalanceScaled = parseUnits(lge.tokenAmount, lge.tokenDecimals);
        const currentCollateralBalanceScaled = parseUnits(lge.collateralAmount, lge.collateralDecimals);

        const swaps = [];
        for (const swap of subgraphSwaps) {
            const block = await blocksSubgraphService.getBlockForTimestamp(swap.timestamp);
            swaps.push({
                timestamp: swap.timestamp,
                blockNumber: parseFloat(block.number),
                transactionHash: swap.tx,
                tokenIn: swap.tokenIn,
                tokenOut: swap.tokenOut,
                tokenAmountIn: swap.tokenAmountIn,
                tokenAmountOut: swap.tokenAmountOut,
            });
        }

        await this.createPriceDataFromSwaps(
            swaps,
            lge,
            currentTokenBalanceScaled,
            currentCollateralBalanceScaled,
            tokenPrices,
        );
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
