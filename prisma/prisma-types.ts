import { Prisma } from '@prisma/client';

const poolWithTokens = Prisma.validator<Prisma.PrismaPoolArgs>()({
    include: { tokens: true },
});

export type PrismaPoolWithTokens = Prisma.PrismaPoolGetPayload<typeof poolWithTokens>;

const poolTokenWithDynamicData = Prisma.validator<Prisma.PrismaPoolTokenArgs>()({
    include: { dynamicData: true },
});

export type PrismaPoolTokenWithDynamicData = Prisma.PrismaPoolTokenGetPayload<typeof poolTokenWithDynamicData>;

export const prismaPoolWithExpandedNesting = Prisma.validator<Prisma.PrismaPoolArgs>()({
    include: {
        linearData: true,
        elementData: true,
        dynamicData: true,
        stableDynamicData: true,
        linearDynamicData: true,
        aprItems: {
            include: {
                subItems: true,
            },
        },
        tokens: {
            include: {
                dynamicData: true,
                nestedPool: {
                    include: {
                        linearData: true,
                        dynamicData: true,
                        stableDynamicData: true,
                        linearDynamicData: true,
                        tokens: {
                            include: {
                                dynamicData: true,
                                nestedPool: {
                                    include: {
                                        linearData: true,
                                        dynamicData: true,
                                        linearDynamicData: true,
                                        tokens: {
                                            include: {
                                                dynamicData: true,
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

const nestedPoolWithSingleLayerNesting = Prisma.validator<Prisma.PrismaPoolArgs>()({
    include: {
        linearData: true,
        dynamicData: true,
        stableDynamicData: true,
        linearDynamicData: true,
        tokens: {
            include: {
                dynamicData: true,
                nestedPool: {
                    include: {
                        linearData: true,
                        dynamicData: true,
                        linearDynamicData: true,
                        tokens: {
                            include: {
                                dynamicData: true,
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

const nestedPoolWithNoNesting = Prisma.validator<Prisma.PrismaPoolArgs>()({
    include: {
        linearData: true,
        dynamicData: true,
        linearDynamicData: true,
        tokens: {
            include: {
                dynamicData: true,
            },
        },
    },
});

export type PrismaNestedPoolWithNoNesting = Prisma.PrismaPoolGetPayload<typeof nestedPoolWithNoNesting>;

const prismaPoolTokenWithExpandedNesting = Prisma.validator<Prisma.PrismaPoolTokenArgs>()({
    include: {
        dynamicData: true,
        nestedPool: {
            include: {
                linearData: true,
                dynamicData: true,
                stableDynamicData: true,
                linearDynamicData: true,
                tokens: {
                    include: {
                        dynamicData: true,
                        nestedPool: {
                            include: {
                                linearData: true,
                                dynamicData: true,
                                linearDynamicData: true,
                                tokens: {
                                    include: {
                                        dynamicData: true,
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
