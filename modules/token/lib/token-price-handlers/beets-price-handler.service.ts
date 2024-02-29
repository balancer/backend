import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { timestampEndOfDayMidnight, timestampRoundedUpToNearestHour } from '../../../common/time';
import { prisma } from '../../../../prisma/prisma-client';
import { FundManagement, SwapTypes, SwapV2 } from '@balancer-labs/sdk';
import { fp } from '../../../big-number/big-number';
import { Contract } from '@ethersproject/contracts';
import { AddressZero } from '@ethersproject/constants';
import VaultAbi from '../../../pool/abi/Vault.json';
import { ethers } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { AllNetworkConfigs } from '../../../network/network-config';
import { tokenAndPrice, updatePrices } from './price-handler-helper';

export class BeetsPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'BeetsPriceHandlerService';
    private readonly beetsAddressFantom = AllNetworkConfigs['250'].data.beets!.address;
    private readonly beetsAddressOptimism = AllNetworkConfigs['10'].data.beets!.address;
    private readonly beetsRpcProvider = AllNetworkConfigs['250'].data.beets!.beetsPriceProviderRpcUrl;

    private getAcceptedTokens(tokens: PrismaTokenWithTypes[]): PrismaTokenWithTypes[] {
        return tokens.filter(
            (token) =>
                (token.chain === 'FANTOM' && token.address === this.beetsAddressFantom) ||
                (token.chain === 'OPTIMISM' && token.address === this.beetsAddressOptimism),
        );
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<PrismaTokenWithTypes[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);
        const updatedTokens: PrismaTokenWithTypes[] = [];
        const tokenAndPrices: tokenAndPrice[] = [];
        const timestamp = timestampRoundedUpToNearestHour();
        const timestampMidnight = timestampEndOfDayMidnight();
        const beetsFtmAddress = '0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e';
        const wftmFtmAddress = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83';
        const freshBeetsPoolId = '0x9e4341acef4147196e99d648c5e43b3fc9d026780002000000000000000005ec';
        const VaultFtmAddress = '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce';

        const assets: string[] = [beetsFtmAddress, wftmFtmAddress];
        const swaps: SwapV2[] = [
            {
                poolId: freshBeetsPoolId,
                assetInIndex: 0,
                assetOutIndex: 1,
                amount: fp(1).toString(),
                userData: '0x',
            },
        ];

        const vaultContract = new Contract(
            VaultFtmAddress,
            VaultAbi,
            new ethers.providers.JsonRpcProvider(this.beetsRpcProvider),
        );
        const funds: FundManagement = {
            sender: AddressZero,
            recipient: AddressZero,
            fromInternalBalance: false,
            toInternalBalance: false,
        };

        let tokenOutAmountScaled = '0';
        try {
            const deltas = await vaultContract.queryBatchSwap(SwapTypes.SwapExactIn, swaps, assets, funds);
            tokenOutAmountScaled = deltas[assets.indexOf(wftmFtmAddress)] ?? '0';
        } catch (err) {
            console.log(`queryBatchSwapTokensIn error: `, err);
        }

        if (tokenOutAmountScaled === '0') {
            throw new Error('BeetsPriceHandlerService: Could not get beets price from on-chain.');
        }

        const ftmPrice = await prisma.prismaTokenCurrentPrice.findUniqueOrThrow({
            where: {
                tokenAddress_chain: { tokenAddress: wftmFtmAddress.toLowerCase(), chain: 'FANTOM' },
            },
        });

        const beetsPrice = ftmPrice.price * Math.abs(parseFloat(formatFixed(tokenOutAmountScaled, 18)));

        for (const token of acceptedTokens) {
            tokenAndPrices.push({ address: token.address, chain: token.chain, price: beetsPrice });

            updatedTokens.push(token);
        }

        await updatePrices(this.id, tokenAndPrices, timestamp, timestampMidnight);

        return updatedTokens;
    }
}
