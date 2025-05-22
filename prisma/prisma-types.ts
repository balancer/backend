import { Prisma, PrismaToken, PrismaTokenTypeOption, PrismaPoolEvent, PrismaPool } from '@prisma/client';

export type PoolUpsertData = {
    pool: PoolCreateWithMappedJsonFields;
    tokens: Prisma.PrismaTokenCreateInput[];
    poolDynamicData: Omit<Prisma.PrismaPoolDynamicDataCreateInput, 'pool'>;
    poolToken: Prisma.PrismaPoolTokenCreateManyInput[];
    poolExpandedTokens: Prisma.PrismaPoolExpandedTokensCreateManyInput[];
};

export type PoolDynamicUpsertData = {
    poolDynamicData: Omit<Prisma.PrismaPoolDynamicDataCreateInput, 'pool'>;
    poolToken: Prisma.PrismaPoolTokenCreateManyInput[];
};

export type SwapEvent = PrismaPoolEvent & {
    type: 'SWAP';
    payload: {
        fee: {
            address: string;
            amount: string;
            valueUSD: string;
        };
        dynamicFee?: {
            address: string;
            amount: string;
            valueUSD: string;
        };
        surplus?: {
            address: string;
            amount: string;
            valueUSD: string;
        };
        tokenIn: {
            address: string;
            amount: string;
        };
        tokenOut: {
            address: string;
            amount: string;
        };
    };
};

export type JoinExitEvent = PrismaPoolEvent & {
    type: 'JOIN' | 'EXIT';
    payload: {
        tokens: {
            address: string;
            amount: string;
            valueUSD: number;
        }[];
    };
};

export const poolsIncludeForAprs = Prisma.validator<Prisma.PrismaPoolDefaultArgs>()({
    include: { dynamicData: true, tokens: { include: { token: true } } },
});

export type PoolForAPRs = Prisma.PrismaPoolGetPayload<typeof poolsIncludeForAprs>;

const poolTokenWithDynamicData = Prisma.validator<Prisma.PrismaPool$tokensArgs>()({
    include: { token: true },
});

export type PrismaPoolTokenWithDynamicData = Prisma.PrismaPoolTokenGetPayload<typeof poolTokenWithDynamicData>;

export const prismaPoolWithExpandedNesting = Prisma.validator<Prisma.PrismaPoolDefaultArgs>()({
    include: {
        dynamicData: true,
        staking: {
            include: {
                farm: {
                    include: {
                        rewarders: true,
                    },
                },
                gauge: {
                    include: {
                        rewards: true,
                    },
                },
                reliquary: {
                    include: {
                        levels: {
                            orderBy: { level: 'asc' },
                        },
                    },
                },
                aura: true,
                vebal: true,
            },
        },
        allTokens: {
            include: {
                token: {
                    include: {
                        types: true,
                    },
                },
                nestedPool: {
                    include: {
                        allTokens: {
                            include: {
                                token: {
                                    include: {
                                        types: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        aprItems: {
            include: {
                range: true,
            },
        },
        tokens: {
            orderBy: { index: 'asc' },
            include: {
                token: {
                    include: { types: true },
                },
                nestedPool: {
                    include: {
                        dynamicData: true,
                        tokens: {
                            orderBy: { index: 'asc' },
                            include: {
                                token: {
                                    include: { types: true },
                                },
                                nestedPool: {
                                    include: {
                                        dynamicData: true,
                                        tokens: {
                                            orderBy: { index: 'asc' },
                                            include: {
                                                token: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
});

export type PrismaPoolWithExpandedNesting = Prisma.PrismaPoolGetPayload<typeof prismaPoolWithExpandedNesting>;

export const nestedPoolWithSingleLayerNesting = Prisma.validator<Prisma.PrismaPoolDefaultArgs>()({
    include: {
        dynamicData: true,
        tokens: {
            orderBy: { index: 'asc' },
            include: {
                token: {
                    include: { types: true },
                },
                nestedPool: {
                    include: {
                        dynamicData: true,
                        tokens: {
                            orderBy: { index: 'asc' },
                            include: {
                                token: true,
                            },
                        },
                    },
                },
            },
        },
    },
});

export type PrismaNestedPoolWithSingleLayerNesting = Prisma.PrismaPoolGetPayload<
    typeof nestedPoolWithSingleLayerNesting
>;

const nestedPoolWithNoNesting = Prisma.validator<Prisma.PrismaPoolDefaultArgs>()({
    include: {
        dynamicData: true,
        tokens: {
            orderBy: { index: 'asc' },
            include: {
                token: true,
            },
        },
    },
});

export type PrismaNestedPoolWithNoNesting = Prisma.PrismaPoolGetPayload<typeof nestedPoolWithNoNesting>;

const prismaPoolTokenWithExpandedNesting = Prisma.validator<Prisma.PrismaPool$tokensArgs>()({
    include: {
        token: {
            include: {
                types: true,
            },
        },
        nestedPool: {
            include: {
                dynamicData: true,
                tokens: {
                    orderBy: { index: 'asc' },
                    include: {
                        token: {
                            include: {
                                types: true,
                            },
                        },
                        nestedPool: {
                            include: {
                                dynamicData: true,
                                tokens: {
                                    orderBy: { index: 'asc' },
                                    include: {
                                        token: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
});

export type PrismaPoolTokenWithExpandedNesting = Prisma.PrismaPoolTokenGetPayload<
    typeof prismaPoolTokenWithExpandedNesting
>;

const prismaPoolTokenWithSingleLayerNesting = Prisma.validator<Prisma.PrismaPool$tokensArgs>()({
    include: {
        token: true,
        nestedPool: {
            include: {
                dynamicData: true,
                tokens: {
                    orderBy: { index: 'asc' },
                    include: {
                        token: true,
                    },
                },
            },
        },
    },
});

export type PrismaPoolTokenWithSingleLayerNesting = Prisma.PrismaPoolTokenGetPayload<
    typeof prismaPoolTokenWithSingleLayerNesting
>;

export type PrismaTokenWithTypes = PrismaToken & {
    types: PrismaTokenTypeOption[];
};

export const prismaPoolMinimal = Prisma.validator<Prisma.PrismaPoolDefaultArgs>()({
    include: {
        dynamicData: true,
        allTokens: {
            include: {
                token: {
                    include: {
                        types: true,
                    },
                },
                nestedPool: {
                    include: {
                        allTokens: {
                            include: {
                                token: {
                                    include: {
                                        types: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        aprItems: {
            include: {
                range: true,
            },
        },
        tokens: {
            orderBy: { index: 'asc' },
            include: {
                token: {
                    include: { types: true },
                },
                nestedPool: {
                    include: {
                        dynamicData: true,
                        tokens: {
                            orderBy: { index: 'asc' },
                            include: {
                                token: {
                                    include: { types: true },
                                },
                                nestedPool: {
                                    include: {
                                        dynamicData: true,
                                        tokens: {
                                            orderBy: { index: 'asc' },
                                            include: {
                                                token: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        staking: {
            include: {
                farm: {
                    include: {
                        rewarders: true,
                    },
                },
                gauge: {
                    include: {
                        rewards: true,
                    },
                },
                reliquary: {
                    include: {
                        levels: {
                            orderBy: { level: 'asc' },
                        },
                    },
                },
                aura: true,
                vebal: true,
            },
        },
    },
});

export type PrismaPoolMinimal = Prisma.PrismaPoolGetPayload<typeof prismaPoolMinimal>;

export const prismaPoolAndHookWithDynamic = Prisma.validator<Prisma.PrismaPoolDefaultArgs>()({
    include: {
        dynamicData: true,
        tokens: {
            orderBy: { index: 'asc' },
            include: {
                token: true,
            },
        },
    },
});

export type PrismaPoolAndHookWithDynamic = Prisma.PrismaPoolGetPayload<typeof prismaPoolAndHookWithDynamic>;

const prismaPoolWithDynamic = Prisma.validator<Prisma.PrismaPoolDefaultArgs>()({
    include: {
        dynamicData: true,
    },
});

export type PrismaPoolWithDynamic = Prisma.PrismaPoolGetPayload<typeof prismaPoolWithDynamic>;

// Define which properties should be replaced and with what type
type PoolJsonTypesMap = {
    hook?: HookData;
    typeData: Record<string, any>;
    liquidityManagement: {
        disableUnbalancedLiquidity?: boolean;
        enableAddLiquidityCustom?: boolean;
        enableDonation?: boolean;
        enableRemoveLiquidityCustom?: boolean;
    };
};

// Utility type that replaces JSON fields in any type
type ReplaceJsonFields<T> = {
    [K in keyof T]: K extends keyof PoolJsonTypesMap ? PoolJsonTypesMap[K] : T[K];
};

export type PoolWithMappedJsonFields = ReplaceJsonFields<PrismaPool>;
export type PoolCreateWithMappedJsonFields = ReplaceJsonFields<Prisma.PrismaPoolCreateInput>;

export type HookData = {
    address: string;
    name?: string;
    type:
        | 'AKRON'
        | 'FEE_TAKING'
        | 'EXIT_FEE'
        | 'STABLE_SURGE'
        | 'MEV_TAX'
        | 'DIRECTIONAL_FEE'
        | 'LOTTERY'
        | 'NFTLIQUIDITY_POSITION'
        | 'VEBAL_DISCOUNT'
        | 'RECLAMM'
        | 'LBP'
        | 'UNKNOWN';
    enableHookAdjustedAmounts: boolean;
    shouldCallAfterSwap: boolean;
    shouldCallBeforeSwap: boolean;
    shouldCallAfterInitialize: boolean;
    shouldCallBeforeInitialize: boolean;
    shouldCallAfterAddLiquidity: boolean;
    shouldCallBeforeAddLiquidity: boolean;
    shouldCallAfterRemoveLiquidity: boolean;
    shouldCallBeforeRemoveLiquidity: boolean;
    shouldCallComputeDynamicSwapFee: boolean;
    dynamicData?: Record<string, string>;
    reviewData?: {
        summary: string;
        reviewFile: string;
        warnings: string[];
    };
};
