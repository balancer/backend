// import {
//     Prisma,
//     PrismaBalancerPoolSnapshot,
//     PrismaBalancerPoolTokenSnapshot,
//     PrismaFarm,
//     PrismaFarmUserSnapshot,
//     PrismaToken,
// } from '@prisma/client';
//
// export interface UserPortfolioData {
//     date: string;
//     timestamp: number;
//     totalValue: number;
//     totalSwapFees: number;
//     totalSwapVolume: number;
//     myFees: number;
//
//     pools: UserPoolData[];
//     tokens: UserTokenData[];
// }
//
// export interface UserPoolData {
//     id: string;
//     poolId: string;
//     poolAddress: string;
//     name: string;
//     shares: number;
//     percentShare: number;
//     totalValue: number;
//     pricePerShare: number;
//     tokens: UserTokenData[];
//     swapFees: number;
//     swapVolume: number;
//     myFees: number;
//     percentOfPortfolio: number;
//     priceChange: number;
//     priceChangePercent: number;
// }
//
// export interface UserTokenData {
//     id: string;
//     address: string;
//     symbol: string;
//     name: string;
//     balance: number;
//     pricePerToken: number;
//     totalValue: number;
//     percentOfPortfolio: number;
// }
//
// export type PrismaFarmUserSnapshotWithFarm = PrismaFarmUserSnapshot & { farm: PrismaFarm };
// export type PrismaBalancerPoolTokenSnapshotWithToken = PrismaBalancerPoolTokenSnapshot & { token: PrismaToken };
// export type PrismaBalancerPoolSnapshotWithTokens = PrismaBalancerPoolSnapshot & {
//     tokens: PrismaBalancerPoolTokenSnapshotWithToken[];
// };
//
// export type PrismaBlockExtended = Prisma.PrismaBlockGetPayload<{
//     include: {
//         poolShares: { include: { poolSnapshot: { include: { tokens: { include: { token: true } } } } } };
//         farmUsers: { include: { farm: true } };
//         beetsBar: true;
//         beetsBarUsers: true;
//     };
// }>;
