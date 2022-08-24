import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { prisma } from '../../../../prisma/prisma-client';
import { networkConfig } from '../../../config/network-config';
import _ from 'lodash';
import { FundManagement, SwapTypes, SwapV2 } from '@balancer-labs/sdk';
import { bn, fp } from '../../../big-number/big-number';
import { Contract } from '@ethersproject/contracts';
import { AddressZero } from '@ethersproject/constants';
import VaultAbi from '../../../pool/abi/Vault.json';
import { BigNumber, ethers } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';

export class BeetsPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'BeetsPriceHandlerService';

    public async getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        return [networkConfig.beets.address];
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        const timestamp = timestampRoundedUpToNearestHour();
        const beetsFtmAddress = '0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e';
        const usdcFtmAddress = '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75';
        const wftmFtmAddress = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83';
        const fidelioPoolId = '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019';
        const fotoPoolId = '0xcdf68a4d525ba2e90fe959c74330430a5a6b8226000200000000000000000008';
        const VaultFtmAddress = '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce';

        const assets: string[] = [beetsFtmAddress, wftmFtmAddress, usdcFtmAddress];
        const swaps: SwapV2[] = [
            {
                poolId: fidelioPoolId,
                assetInIndex: 0,
                assetOutIndex: 1,
                amount: fp(1).toString(),
                userData: '0x',
            },
            {
                poolId: fotoPoolId,
                assetInIndex: 1,
                assetOutIndex: 2,
                amount: '0',
                userData: '0x',
            },
        ];

        const vaultContract = new Contract(
            VaultFtmAddress,
            VaultAbi,
            new ethers.providers.JsonRpcProvider(networkConfig.beetsPriceProviderRpcUrl),
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
            tokenOutAmountScaled = deltas[assets.indexOf(usdcFtmAddress)] ?? '0';
        } catch (err) {
            console.log(`queryBatchSwapTokensIn error: `, err);
        }

        if (tokenOutAmountScaled === '0') {
            throw new Error('BeetsPriceHandlerService: Could not get beets price from on-chain.');
        }

        const beetsPrice = Math.abs(parseFloat(formatFixed(tokenOutAmountScaled, 6)));

        await prisma.prismaTokenCurrentPrice.upsert({
            where: { tokenAddress: networkConfig.beets.address },
            update: { price: beetsPrice },
            create: {
                tokenAddress: networkConfig.beets.address,
                timestamp,
                price: beetsPrice,
            },
        });

        await prisma.prismaTokenPrice.upsert({
            where: { tokenAddress_timestamp: { tokenAddress: networkConfig.beets.address, timestamp } },
            update: { price: beetsPrice, close: beetsPrice },
            create: {
                tokenAddress: networkConfig.beets.address,
                timestamp,
                price: beetsPrice,
                high: beetsPrice,
                low: beetsPrice,
                open: beetsPrice,
                close: beetsPrice,
            },
        });

        return [networkConfig.beets.address];
    }
}
