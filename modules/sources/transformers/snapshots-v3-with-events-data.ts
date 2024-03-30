import _ from 'lodash';
import { PoolSnapshotFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import { Chain, Prisma, PrismaPoolSnapshot } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { weiToFloat } from '../../common/numbers';

interface PoolStatsFromEvents {
    id: string;
    timestamp: number;
    pool_id: string;
    total_swaps: number;
    total_join_exits: number;
    daily_volume: number;
    inflow: number;
    outflow: number;
    balance: number;
    volume: number;
    tvl: number;
}

interface PoolVolumeFromSwaps {
    id: string;
    timestamp: number;
    pool_id: string;
    total_swaps: number;
    daily_volume: number;
    volume: number;
}

interface PoolTvlFromJoinsExits {
    id: string;
    timestamp: number;
    pool_id: string;
    total_join_exits: number;
    inflow: number;
    outflow: number;
    daily_balance: number;
    tvl: number;
}

const getVolumeStatsFromSwaps = async (poolIds: string[], timestamps: number[]): Promise<PoolVolumeFromSwaps[]> => {
    // Get data for the given pool IDs and timestamps
    const query = Prisma.sql`
        WITH daily_volumes AS (
            SELECT
                date_trunc('day', to_timestamp("blockTimestamp")) AS day,
                "poolId" as pool_id,
                COUNT(*) AS total_swaps,
                SUM("valueUSD") AS daily_volume
            FROM
                "PrismaPoolEvent"
            WHERE
                type = 'SWAP'
            GROUP BY
                1, 2
        )
        SELECT
            CONCAT(dv.pool_id, '-', EXTRACT(epoch from dv.day)::int) AS id,
            EXTRACT(epoch from dv.day)::int AS timestamp,
            dv.pool_id,
            dv.total_swaps,
            dv.daily_volume,
            SUM(dv.daily_volume) OVER (PARTITION BY dv.pool_id ORDER BY dv.day ASC) AS volume
        FROM
            daily_volumes dv
        WHERE
            dv.pool_id IN (${Prisma.join(poolIds, ',')})
            AND EXTRACT(epoch from dv.day)::int::text IN (${Prisma.join(timestamps.map(String), ',')})
    `;

    const poolVolumes = await prisma.$queryRaw<PoolVolumeFromSwaps[]>(query);

    return poolVolumes;
};

const getTvlStatsFromJoinsExits = async (poolIds: string[], timestamps: number[]): Promise<PoolTvlFromJoinsExits[]> => {
    // Get data for the given pool IDs and timestamps
    const query = Prisma.sql`
        WITH daily_tvls AS (
            SELECT
                date_trunc('day', to_timestamp("blockTimestamp")) AS day,
                "poolId" as pool_id,
                COUNT(*) AS total_join_exits,
                SUM(CASE WHEN type = 'JOIN' THEN "valueUSD" ELSE 0 END) AS inflow,
                SUM(CASE WHEN type = 'EXIT' THEN "valueUSD" ELSE 0 END) AS outflow,
                SUM(CASE WHEN type = 'JOIN' THEN "valueUSD" ELSE -"valueUSD" END) AS daily_balance
            FROM
                "PrismaPoolEvent"
            WHERE
                type IN ('JOIN', 'EXIT')
            GROUP BY
                1, 2
        )
        SELECT
            CONCAT(dt.pool_id, '-', EXTRACT(epoch from dt.day)::int) AS id,
            EXTRACT(epoch from dt.day)::int AS timestamp,
            dt.pool_id,
            dt.total_join_exits,
            dt.inflow,
            dt.outflow,
            dt.daily_balance,
            SUM(dt.daily_balance) OVER (PARTITION BY dt.pool_id ORDER BY dt.day ASC) AS tvl
        FROM
            daily_tvls dt
        WHERE
            dt.pool_id IN (${Prisma.join(poolIds, ',')})
            AND EXTRACT(epoch from dt.day)::int::text IN (${Prisma.join(timestamps.map(String), ',')})
    `;

    const poolTvls = await prisma.$queryRaw<PoolTvlFromJoinsExits[]>(query);

    return poolTvls;
};

export const getStatsFromEvents = async (poolIds: string[], timestamps: number[]): Promise<PoolStatsFromEvents[]> => {
    // TODO: benchmark if separate queries, without a hash full join are faster
    // Just checking in the console, the separate queries are faster
    const volumeStats = await getVolumeStatsFromSwaps(poolIds, timestamps);
    const tvlStats = await getTvlStatsFromJoinsExits(poolIds, timestamps);

    // Merge IDs from volume and tvl stats
    const ids = _.uniq([...volumeStats.map((stat) => stat.id), ...tvlStats.map((stat) => stat.id)]);
    return ids.map((id) => {
        const volumeStat = volumeStats.find((stat) => stat.id === id);
        const tvlStat = tvlStats.find((stat) => stat.id === id);

        return {
            id,
            timestamp: volumeStat?.timestamp || tvlStat?.timestamp || 0,
            pool_id: volumeStat?.pool_id || tvlStat?.pool_id || '',
            total_swaps: volumeStat?.total_swaps || 0,
            total_join_exits: tvlStat?.total_join_exits || 0,
            daily_volume: volumeStat?.daily_volume || 0,
            inflow: tvlStat?.inflow || 0,
            outflow: tvlStat?.outflow || 0,
            balance: tvlStat?.daily_balance || 0,
            volume: volumeStat?.volume || 0,
            tvl: tvlStat?.tvl || 0,
        };
    });

    // Get data for the given pool IDs and timestamps
    const query = Prisma.sql`
        WITH daily_volumes AS (
            SELECT
                date_trunc('day', to_timestamp("blockTimestamp")) AS day,
                "poolId" as pool_id,
                COUNT(*) AS total_swaps,
                SUM("valueUSD") AS daily_volume
            FROM
                "PrismaPoolEvent"
            WHERE
                type = 'SWAP'
            GROUP BY
                1, 2
        ), daily_tvls AS (
            SELECT
                date_trunc('day', to_timestamp("blockTimestamp")) AS day,
                "poolId" as pool_id,
                COUNT(*) AS total_join_exits,
                SUM(CASE WHEN type = 'JOIN' THEN "valueUSD" ELSE 0 END) AS inflow,
                SUM(CASE WHEN type = 'EXIT' THEN "valueUSD" ELSE 0 END) AS outflow,
                SUM(CASE WHEN type = 'JOIN' THEN "valueUSD" ELSE -"valueUSD" END) AS balance
            FROM
                "PrismaPoolEvent"
            WHERE
                type IN ('JOIN', 'EXIT')
            GROUP BY
                1, 2
        )
        SELECT
            CONCAT(COALESCE(dv.pool_id, dt.pool_id), '-', EXTRACT(epoch from COALESCE(dv.day, dt.day))::int) AS id,
            EXTRACT(epoch from COALESCE(dv.day, dt.day))::int AS timestamp,
            COALESCE(dv.pool_id, dt.pool_id) AS pool_id,
            COALESCE(dv.total_swaps, 0) AS total_swaps,
            COALESCE(dt.total_join_exits, 0) AS total_join_exits,
            COALESCE(dv.daily_volume, 0) AS daily_volume,
            COALESCE(dt.inflow, 0) AS inflow,
            COALESCE(dt.outflow, 0) AS outflow,
            COALESCE(dt.balance, 0) AS balance,
            SUM(COALESCE(dv.daily_volume, 0)) OVER (PARTITION BY COALESCE(dv.pool_id, dt.pool_id) ORDER BY COALESCE(dv.day, dt.day) ASC) AS volume,
            SUM(COALESCE(dt.balance, 0)) OVER (PARTITION BY COALESCE(dv.pool_id, dt.pool_id) ORDER BY COALESCE(dv.day, dt.day) ASC) AS tvl
        FROM
            daily_volumes dv
        FULL OUTER JOIN
            daily_tvls dt ON dv.day = dt.day AND dv.pool_id = dt.pool_id
        WHERE
            COALESCE(dv.pool_id, dt.pool_id) IN (${Prisma.join(poolIds, ',')})
            AND EXTRACT(epoch from COALESCE(dv.day, dt.day))::int::text IN (${Prisma.join(timestamps.map(String), ',')})
    `;

    const poolTvls = await prisma.$queryRaw<PoolStatsFromEvents[]>(query);

    return poolTvls;
};

/**
 * Takes V3 subgraph snapshots and transforms them into DB entries
 * with additional data from events.
 *
 * @param snapshots
 * @param chain
 * @returns
 */
export const snapshotsV3WithEventsData = async (
    snapshots: PoolSnapshotFragment[],
    chain: Chain,
): Promise<PrismaPoolSnapshot[]> => {
    // Get data for the given pool IDs and timestamps
    const poolIds = snapshots.map((snapshot) => snapshot.pool.id);
    const timestamps = snapshots.map((snapshot) => snapshot.timestamp);
    const volumeStats = await getVolumeStatsFromSwaps(poolIds, timestamps);
    const tvlStats = await getTvlStatsFromJoinsExits(poolIds, timestamps);

    // Group by ID
    const volumeStatsById = volumeStats.reduce((acc, stat) => {
        acc[stat.id] = stat;
        return acc;
    }, {} as Record<string, PoolVolumeFromSwaps>);
    const tvlStatsById = tvlStats.reduce((acc, stat) => {
        acc[stat.id] = stat;
        return acc;
    }, {} as Record<string, PoolTvlFromJoinsExits>);
    const statsById = _.merge(volumeStatsById, tvlStatsById);

    // TODO: benchmark if separate queries, without a hash full join are faster
    // const stats = await getStatsFromEvents(poolIds, timestamps);

    // // Group by ID
    // const statsById = stats.reduce((acc, stat) => {
    //     acc[stat.id] = stat;
    //     return acc;
    // }, {} as Record<string, PoolStatsFromEvents>);

    const allTokens = await prisma.prismaToken.findMany({ where: { chain } });

    // Upsert snapshots
    const data = snapshots.map((snapshot) => {
        const stats = statsById[snapshot.id] || {};
        const totalSharesNum = weiToFloat(snapshot.totalShares, 18);

        return {
            id: snapshot.id,
            chain,
            poolId: snapshot.pool.id,
            timestamp: snapshot.timestamp,
            totalLiquidity: stats.tvl, // TODO: maybe better to calculate total liquidity based on balances from subgraph?
            sharePrice: stats.tvl / totalSharesNum,
            volume24h: stats.daily_volume,
            fees24h: stats.daily_volume * parseFloat(snapshot.pool.swapFee),
            totalShares: snapshot.totalShares,
            totalSharesNum,
            totalSwapVolume: stats.volume,
            totalSwapFee: stats.volume * parseFloat(snapshot.pool.swapFee),
            swapsCount: Number(snapshot.swapsCount),
            holdersCount: Number(snapshot.holdersCount),
            amounts: snapshot.balances.map((balance, index) => {
                const address = snapshot.pool.tokens.find((t) => t.index === index)?.address || '';
                return String(weiToFloat(balance, allTokens.find((t) => t.address === address)?.decimals || 18));
            }),
            totalVolumes: [],
            totalProtocolSwapFees: [],
            totalProtocolYieldFees: [],
            // TODO: unify the amount format to the other models, that means updating the V2 snapshots as well
            // amounts: snapshot.balances.map((balance, index) => {
            //     const address = snapshot.pool.tokens.find((t) => t.index === index)?.address || '';
            //     return {
            //         address,
            //         amount: String(weiToFloat(balance, allTokens.find((t) => t.address === address)?.decimals || 18)),
            //         valueUSD: 0,
            //     };
            // }),
        };
    });

    return data;
};
