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
        const response = await fetch(TOKEN_LIST_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch token list: ${response.statusText}`);
        }
        const { tokens } = (await response.json()) as WhitelistedTokenList;

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
        const [existingBlockedTypes, blockedTokensCsv] = await Promise.all([
            prisma.prismaTokenType.findMany({
                select: { id: true, tokenAddress: true, chain: true, type: true },
                where: { type: { in: [PrismaTokenTypeOption.BLOCKED_V2, PrismaTokenTypeOption.BLOCKED_V3] } },
            }),
            fetch(BLOCKED_TOKENS_URL).then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch blocked tokens: ${response.statusText}`);
                }
                return { data: await response.text() };
            }),
        ]);

        const githubBlockedTokens = blockedTokensCsv.data
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => {
                const [chainId, tokenAddress, protocolVersion] = line.split(',');
                return {
                    tokenAddress: tokenAddress?.toLowerCase(),
                    chain: chainIdToChain[parseInt(chainId)],
                    protocolVersion: parseInt(protocolVersion),
                };
            })
            .filter(
                (token) =>
                    token.tokenAddress && token.chain && (token.protocolVersion === 2 || token.protocolVersion === 3),
            );

        const existingTokensInDB = await prisma.prismaToken.findMany({
            where: {
                OR: githubBlockedTokens.map((token) => ({
                    address: token.tokenAddress,
                    chain: token.chain,
                })),
            },
            select: { address: true, chain: true },
        });

        const tokenExistsInDB = new Set(existingTokensInDB.map((token) => `${token.address}-${token.chain}`));

        const { tokensToAdd: v2TokensToAdd, tokensToRemove: v2TokensToRemove } = this.getTokensToSync(
            2,
            PrismaTokenTypeOption.BLOCKED_V2,
            githubBlockedTokens,
            existingBlockedTypes,
            tokenExistsInDB,
        );
        const { tokensToAdd: v3TokensToAdd, tokensToRemove: v3TokensToRemove } = this.getTokensToSync(
            3,
            PrismaTokenTypeOption.BLOCKED_V3,
            githubBlockedTokens,
            existingBlockedTypes,
            tokenExistsInDB,
        );

        const operations = [];

        const allTokensToAdd = [...v2TokensToAdd, ...v3TokensToAdd];
        const allTokensToRemove = [...v2TokensToRemove, ...v3TokensToRemove];

        if (allTokensToAdd.length > 0) {
            operations.push(
                prisma.prismaTokenType.createMany({
                    skipDuplicates: true,
                    data: allTokensToAdd,
                }),
            );
        }

        if (allTokensToRemove.length > 0) {
            operations.push(
                prisma.prismaTokenType.deleteMany({
                    where: { id: { in: allTokensToRemove } },
                }),
            );
        }

        if (operations.length > 0) {
            await prisma.$transaction(operations);
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

    private getTokensToSync(
        protocolVersion: number,
        blockType: PrismaTokenTypeOption,
        githubBlockedTokens: {
            tokenAddress: string;
            chain: Chain;
            protocolVersion: number;
        }[],
        existingBlockedTypes: {
            id: string;
            tokenAddress: string;
            chain: Chain;
            type: PrismaTokenTypeOption;
        }[],
        tokenExistsInDB: Set<string>,
    ) {
        const tokensToAdd = githubBlockedTokens
            .filter(
                (token) =>
                    token.protocolVersion === protocolVersion &&
                    tokenExistsInDB.has(`${token.tokenAddress}-${token.chain}`) &&
                    !existingBlockedTypes.some(
                        (dbToken) =>
                            dbToken.tokenAddress === token.tokenAddress &&
                            dbToken.chain === token.chain &&
                            dbToken.type === blockType,
                    ),
            )
            .map((token) => ({
                id: `${token.tokenAddress}-${token.chain}-${blockType}`,
                type: blockType,
                tokenAddress: token.tokenAddress,
                chain: token.chain,
            }));

        const tokensToRemove = existingBlockedTypes
            .filter(
                (dbToken) =>
                    dbToken.type === blockType &&
                    !githubBlockedTokens.some(
                        (githubToken) =>
                            githubToken.tokenAddress === dbToken.tokenAddress &&
                            githubToken.chain === dbToken.chain &&
                            githubToken.protocolVersion === protocolVersion,
                    ),
            )
            .map((dbToken) => dbToken.id);

        return { tokensToAdd, tokensToRemove };
    }

    async getFeaturedPools(chains: Chain[]): Promise<FeaturedPool[]> {
        const response = await fetch(POOLS_METADATA_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch featured pools: ${response.statusText}`);
        }
        const data = (await response.json()) as FeaturedPoolMetadata[];
        const pools = data.filter((pool) => chains.includes(chainIdToChain[pool.chainId]));
        return pools.map(({ id, primary, chainId, description }) => ({
            poolId: id,
            chain: chainIdToChain[chainId],
            primary: Boolean(primary),
            description: description,
        })) as FeaturedPool[];
    }
}
