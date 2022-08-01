import { env } from '../../app/env';
import { sanityClient } from '../sanity/sanity';
import { copperProxyService, CopperProxyService } from '../copper/copper-proxy.service';
import { getAddress } from 'ethers/lib/utils';
import { gnosisSafeService, GnosisSafeService } from '../gnosis/gnosis-safe.service';

export type LiquidityGenerationCreateInput = {
    id: string;
    address: string;
    bannerImageUrl: string;
    collateralAmount: string;
    collateralEndWeight: number;
    collateralStartWeight: number;
    collateralTokenAddress: string;
    description: string;
    discordUrl: string;
    endDate: string;
    mediumUrl: string;
    name: string;
    startDate: string;
    swapFeePercentage: string;
    telegramUrl: string;
    tokenAmount: string;
    tokenContractAddress: string;
    tokenEndWeight: number;
    tokenIconUrl: string;
    tokenStartWeight: number;
    twitterUrl: string;
    websiteUrl: string;
};

export type LiquidityGenerationEvent = {
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

export class LiquidityGenerationEventService {
    constructor(
        private readonly gnosisSafeService: GnosisSafeService,
        private readonly copperProxyService: CopperProxyService,
    ) {}
    public async createLiquidityGenerationEvent(
        input: LiquidityGenerationCreateInput,
    ): Promise<LiquidityGenerationEvent> {
        const poolOwner = await this.copperProxyService.getLbpPoolOwner(getAddress(input.address));
        const adminIsMultisig = await this.gnosisSafeService.isAddressGnosisSafe(getAddress(poolOwner));

        return sanityClient.create({
            _type: 'lbp',
            _id: input.id,
            id: input.id,
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
            startDate: input.startDate,
            endDate: input.endDate,
            tokenContractAddress: input.tokenContractAddress,
            collateralTokenAddress: input.collateralTokenAddress,
            tokenAmount: input.tokenAmount,
            collateralAmount: input.collateralAmount,
            tokenStartWeight: input.tokenStartWeight,
            collateralStartWeight: input.collateralStartWeight,
            tokenEndWeight: input.tokenEndWeight,
            collateralEndWeight: input.collateralEndWeight,
            swapFeePercentage: input.swapFeePercentage,
            adminAddress: poolOwner,
            adminIsMultisig,
            chainId: env.CHAIN_ID,
        });
    }

    public async getLges(): Promise<LiquidityGenerationEvent[]> {
        return sanityClient.fetch(`*[_type == "lbp" && chainId == "${env.CHAIN_ID}"]`);
    }

    public async getLiquidityGenerationEvent(id: string): Promise<LiquidityGenerationEvent> {
        const result = await sanityClient.fetch(
            `*[_type == "lbp" && chainId == "${env.CHAIN_ID}" && id == "${id}"][0]`,
        );
        if (!result) {
            throw new Error(`Liquidity generation event with id ${id} not found`);
        }
        return result;
    }
}

export const liquidityGenerationEventService = new LiquidityGenerationEventService(
    gnosisSafeService,
    copperProxyService,
);
