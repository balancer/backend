import axios from 'axios';
import { prisma } from '../../prisma/prisma-client';
import { chainIdToChain, chainToChainId as chainToIdMap } from '../network/chain-id-to-chain';
import { Chain, Prisma, PrismaTokenTypeOption } from '@prisma/client';
import { GqlChain } from '../../apps/api/gql/generated-schema';

const POOLS_METADATA_URL = 'https://raw.githubusercontent.com/balancer/metadata/main/pools/featured.json';

const TOKEN_LIST_URL = 'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/balancer.tokenlist.json';

const BLOCKED_TOKENS_URL = 'https://raw.githubusercontent.com/balancer/blocklist/refs/heads/main/tokens/blocked.csv';

interface FeaturedPoolMetadata {
    id: string;
    imageUrl: string;
    primary: boolean;
    chainId: number;
    description: string;
}
interface WhitelistedTokenList {
    name: string;
    timestamp: string;
    tokens: WhitelistedToken[];
}

interface WhitelistedToken {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    extensions?: {
        coingeckoId?: string;
    };
}

export interface FeaturedPool {
    poolId: string;
    primary: boolean;
    chain: GqlChain;
    description: string;
}

export class GithubContentService {
    async syncTokenContentData(chains: Chain[]): Promise<void> {
        const {
            data: { tokens },
        } = await axios.get<WhitelistedTokenList>(TOKEN_LIST_URL);

        // Validate results
        const requiredKeys = ['chainId', 'address', 'name', 'symbol', 'decimals'];
        const chainIds = chains.map((chain) => Number(chainToIdMap[chain]));
        const upsertTokens = tokens
            .filter(
                (token) =>
                    requiredKeys.every((key) => token?.[key as keyof WhitelistedToken] != null) &&
                    chainIds.includes(token.chainId),
            )
            .map((token) => ({
                address: token.address.toLowerCase(),
                chain: chainIdToChain[token.chainId],
                name: token.name.replace(/[\x00]/g, ''),
                symbol: token.symbol.replace(/[\x00]/g, ''),
                decimals: token.decimals,
                logoURI: token.logoURI,
                coingeckoTokenId: token.extensions?.coingeckoId,
                types: {
                    connectOrCreate: {
                        where: {
                            tokenAddress_type_chain: {
                                tokenAddress: token.address.toLowerCase(),
                                type: PrismaTokenTypeOption.WHITE_LISTED,
                                chain: chainIdToChain[token.chainId],
                            },
                        },
                        create: {
                            id: `${token.address.toLowerCase()}-white-listed`,
                            type: PrismaTokenTypeOption.WHITE_LISTED,
                        },
                    },
                },
            }));

        const upserts = upsertTokens.map((token) =>
            prisma.prismaToken.upsert({
                where: {
                    address_chain: { address: token.address, chain: token.chain },
                },
                create: token,
                update: token,
            }),
        );

        await prisma.$transaction(upserts);

        await this.syncBlockedTokens();

        // TODO: This should be removed and moved to pool creation, it doesn't ever change
        await this.syncBPTTypes();
    }

    private async syncBlockedTokens() {
        const dbBlockedTokens = await prisma.prismaTokenType.findMany({
            select: { id: true, tokenAddress: true, chain: true, type: true },
            where: { type: { in: [PrismaTokenTypeOption.BLOCKED_V2, PrismaTokenTypeOption.BLOCKED_V3] } },
        });

        // fetch blocked tokens from github
        const { data: blockedTokensCsv } = await axios.get<string>(BLOCKED_TOKENS_URL);
        const githubBlockedTokens = blockedTokensCsv
            .split('\n')
            .map((line) => {
                const [chainId, tokenAddress, version] = line.split(',');
                return { tokenAddress, chain: chainIdToChain[chainId], version };
            })
            .filter((token) => token.tokenAddress && token.chain);

        // add blocked tokens to db
        const blockedV2TokensToAddToDB = githubBlockedTokens
            .filter(
                (token) =>
                    !dbBlockedTokens.some(
                        (dbToken) =>
                            dbToken.tokenAddress === token.tokenAddress &&
                            dbToken.chain === token.chain &&
                            dbToken.type === PrismaTokenTypeOption.BLOCKED_V2,
                    ),
            )
            .map((token) => ({
                id: `${token.tokenAddress}-${token.chain}-${PrismaTokenTypeOption.BLOCKED_V2}`,
                type: PrismaTokenTypeOption.BLOCKED_V2,
                tokenAddress: token.tokenAddress,
                chain: token.chain,
            }));

        if (blockedV2TokensToAddToDB.length > 0) {
            await prisma.prismaTokenType.createMany({ skipDuplicates: true, data: blockedV2TokensToAddToDB });
        }

        const blockedV3TokensToAddToDB = githubBlockedTokens
            .filter(
                (token) =>
                    !dbBlockedTokens.some(
                        (dbToken) =>
                            dbToken.tokenAddress === token.tokenAddress &&
                            dbToken.chain === token.chain &&
                            dbToken.type === PrismaTokenTypeOption.BLOCKED_V3,
                    ),
            )
            .map((token) => ({
                id: `${token.tokenAddress}-${token.chain}-${PrismaTokenTypeOption.BLOCKED_V3}`,
                type: PrismaTokenTypeOption.BLOCKED_V3,
                tokenAddress: token.tokenAddress,
                chain: token.chain,
            }));

        if (blockedV3TokensToAddToDB.length > 0) {
            await prisma.prismaTokenType.createMany({ skipDuplicates: true, data: blockedV3TokensToAddToDB });
        }

        // remove tokens from db that are not in github blocked tokens
        const blockedV2TokensToRemoveFromDB = dbBlockedTokens
            .filter(
                (dbToken) =>
                    !githubBlockedTokens.some(
                        (token) =>
                            token.tokenAddress === dbToken.tokenAddress &&
                            token.chain === dbToken.chain &&
                            dbToken.type === PrismaTokenTypeOption.BLOCKED_V2,
                    ),
            )
            .map((dbToken) => ({
                id: `${dbToken.tokenAddress}-${dbToken.chain}-${PrismaTokenTypeOption.BLOCKED_V2}`,
            }));

        if (blockedV2TokensToRemoveFromDB.length > 0) {
            await prisma.prismaTokenType.deleteMany({
                where: { id: { in: blockedV2TokensToRemoveFromDB.map((token) => token.id) } },
            });
        }

        const blockedV3TokensToRemoveFromDB = dbBlockedTokens
            .filter(
                (dbToken) =>
                    !githubBlockedTokens.some(
                        (token) =>
                            token.tokenAddress === dbToken.tokenAddress &&
                            token.chain === dbToken.chain &&
                            dbToken.type === PrismaTokenTypeOption.BLOCKED_V3,
                    ),
            )
            .map((dbToken) => ({
                id: `${dbToken.tokenAddress}-${dbToken.chain}-${PrismaTokenTypeOption.BLOCKED_V3}`,
            }));

        if (blockedV3TokensToRemoveFromDB.length > 0) {
            await prisma.prismaTokenType.deleteMany({
                where: { id: { in: blockedV3TokensToRemoveFromDB.map((token) => token.id) } },
            });
        }
    }

    private async syncBPTTypes() {
        const pools = await prisma.prismaPool.findMany({
            select: { address: true, type: true, chain: true },
        });

        const bptTypes = pools.map((pool) => ({
            id: `${pool.address}-bpt`,
            chain: pool.chain,
            type: PrismaTokenTypeOption.BPT,
            tokenAddress: pool.address,
        }));

        const phantomBptTypes = pools
            .filter((pool) => pool.type === 'COMPOSABLE_STABLE')
            .map((pool) => ({
                id: `${pool.address}-phantom-bpt`,
                chain: pool.chain,
                type: PrismaTokenTypeOption.PHANTOM_BPT,
                tokenAddress: pool.address,
            }));

        await prisma.prismaTokenType.createMany({ skipDuplicates: true, data: [...bptTypes, ...phantomBptTypes] });
    }

    async getFeaturedPools(chains: Chain[]): Promise<FeaturedPool[]> {
        const { data } = await axios.get<FeaturedPoolMetadata[]>(POOLS_METADATA_URL);
        const pools = data.filter((pool) => chains.includes(chainIdToChain[pool.chainId]));
        return pools.map(({ id, primary, chainId, description }) => ({
            poolId: id,
            chain: chainIdToChain[chainId],
            primary: Boolean(primary),
            description: description,
        })) as FeaturedPool[];
    }
}
