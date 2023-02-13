import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { prisma } from '../../../../prisma/prisma-client';
import { Contract } from '@ethersproject/contracts';
import { ethers } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import PriceRateProviderAbi from '../../abi/CLQDRPerpetualEscrowTokenRateProvider.json';
import { networkContext } from '../../../network/network-context.service';

export class ClqdrPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'ClqdrPriceHandlerService';
    private readonly clqdrAddress = '0x814c66594a22404e101fecfecac1012d8d75c156';
    private readonly lqdrAddress = '0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9';
    private readonly clqdrPriceRateProviderAddress = '0x1a148871bf262451f34f13cbcb7917b4fe59cb32';

    public async getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        return [this.clqdrAddress];
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        const timestamp = timestampRoundedUpToNearestHour();

        const clqdrPriceRateProviderContract = new Contract(
            this.clqdrPriceRateProviderAddress,
            PriceRateProviderAbi,
            new ethers.providers.JsonRpcProvider(networkContext.data.rpcUrl),
        );

        let clqdrRate = 0;

        try {
            const getRate = await clqdrPriceRateProviderContract.getRate();
            clqdrRate = parseFloat(formatFixed(getRate, 18));
        } catch (err) {
            console.log(`getRate error: `, err);
        }

        if (clqdrRate === 0) {
            throw new Error(`ClqdrPriceHandlerService: Could not get clqdr rate from on-chain`);
        }

        const lqdrPrice = await prisma.prismaTokenCurrentPrice.findFirst({
            orderBy: { timestamp: 'desc' },
            where: { tokenAddress: this.lqdrAddress, chain: networkContext.chain },
        });

        if (!lqdrPrice) {
            throw new Error(
                `ClqdrPriceHandlerService: Could not get LQDR price from DB. Need LQDR price to calculate CLQDR price.`,
            );
        }

        const clqdrPrice = lqdrPrice.price * clqdrRate;

        await prisma.prismaTokenCurrentPrice.upsert({
            where: { tokenAddress_chain: { tokenAddress: this.clqdrAddress, chain: networkContext.chain } },
            update: { price: clqdrPrice },
            create: {
                tokenAddress: this.clqdrAddress,
                chain: networkContext.chain,
                timestamp,
                price: clqdrPrice,
            },
        });

        await prisma.prismaTokenPrice.upsert({
            where: {
                tokenAddress_timestamp_chain: {
                    tokenAddress: this.clqdrAddress,
                    timestamp,
                    chain: networkContext.chain,
                },
            },
            update: { price: clqdrPrice, close: clqdrPrice },
            create: {
                tokenAddress: this.clqdrAddress,
                chain: networkContext.chain,
                timestamp,
                price: clqdrPrice,
                high: clqdrPrice,
                low: clqdrPrice,
                open: clqdrPrice,
                close: clqdrPrice,
            },
        });

        return [this.clqdrAddress];
    }
}
