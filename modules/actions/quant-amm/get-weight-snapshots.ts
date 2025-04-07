import { PrismaClient, Chain } from '@prisma/client';

async function getWeightSnapshots(
    prisma: PrismaClient,
    pool: string,
    chain: Chain,
    days: number = 7,
    bucketSizeSeconds: number = 3600,
) {
    const now = Math.floor(Date.now() / 1000);
    const from = now - days * 86400;

    const snapshots = await prisma.quantWeights.findMany({
        where: {
            pool,
            chain,
            timestamp: { gte: from },
        },
        orderBy: { timestamp: 'asc' },
    });

    const result: any[] = [];
    const n = snapshots.length;
    let snapshotIndex = 0;
    let lastSnapshot: any = null;

    // Iterate over time buckets
    for (let t = from; t < now; t += bucketSizeSeconds) {
        const bucketSnapshots: any[] = [];

        // Advance pointer to skip snapshots before the current bucket
        while (snapshotIndex < n && snapshots[snapshotIndex].timestamp < t) {
            lastSnapshot = snapshots[snapshotIndex];
            snapshotIndex++;
        }

        // Collect snapshots that fall into the current bucket
        let j = snapshotIndex;
        while (j < n && snapshots[j].timestamp < t + bucketSizeSeconds) {
            bucketSnapshots.push(snapshots[j]);
            lastSnapshot = snapshots[j];
            j++;
        }
        snapshotIndex = j; // update pointer for next bucket

        if (bucketSnapshots.length > 0) {
            // Calculate averages for each weight in the bucket
            const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
            const bucketWeights = bucketSnapshots.reduce(
                (agg, s) => {
                    agg.weight1.push(s.weight1);
                    agg.weight2.push(s.weight2);
                    s.weight3 !== undefined && s.weight3 !== null && agg.weight3.push(s.weight3);
                    s.weight4 !== undefined && s.weight4 !== null && agg.weight4.push(s.weight4);
                    s.weight5 !== undefined && s.weight5 !== null && agg.weight5.push(s.weight5);
                    s.weight6 !== undefined && s.weight6 !== null && agg.weight6.push(s.weight6);
                    s.weight7 !== undefined && s.weight7 !== null && agg.weight7.push(s.weight7);
                    s.weight8 !== undefined && s.weight8 !== null && agg.weight8.push(s.weight8);
                    return agg;
                },
                {
                    weight1: [] as number[],
                    weight2: [] as number[],
                    weight3: [] as number[],
                    weight4: [] as number[],
                    weight5: [] as number[],
                    weight6: [] as number[],
                    weight7: [] as number[],
                    weight8: [] as number[],
                },
            );
            result.push({
                timestamp: t,
                weight1: avg(bucketWeights.weight1),
                weight2: avg(bucketWeights.weight2),
                weight3: avg(bucketWeights.weight3),
                weight4: avg(bucketWeights.weight4),
                weight5: avg(bucketWeights.weight5),
                weight6: avg(bucketWeights.weight6),
                weight7: avg(bucketWeights.weight7),
                weight8: avg(bucketWeights.weight8),
            });
        } else {
            // No snapshots in the bucket; interpolate using lastSnapshot and the next snapshot
            const before = lastSnapshot;
            const after = snapshotIndex < n ? snapshots[snapshotIndex] : null;

            if (!before) {
                // No data available; skip this bucket
                continue;
            }

            if (!after) {
                // No future snapshot; use the last known values
                result.push({
                    timestamp: t,
                    weight1: before.weight1,
                    weight2: before.weight2,
                    weight3: before.weight3,
                    weight4: before.weight4,
                    weight5: before.weight5,
                    weight6: before.weight6,
                    weight7: before.weight7,
                    weight8: before.weight8,
                });
            } else {
                const ratio = (t - before.timestamp) / (after.timestamp - before.timestamp);
                const interpolate = (a: number | null, b: number | null) =>
                    a != null && b != null ? a + (b - a) * ratio : a ?? b ?? null;
                result.push({
                    timestamp: t,
                    weight1: interpolate(before.weight1, after.weight1),
                    weight2: interpolate(before.weight2, after.weight2),
                    weight3: interpolate(before.weight3, after.weight3),
                    weight4: interpolate(before.weight4, after.weight4),
                    weight5: interpolate(before.weight5, after.weight5),
                    weight6: interpolate(before.weight6, after.weight6),
                    weight7: interpolate(before.weight7, after.weight7),
                    weight8: interpolate(before.weight8, after.weight8),
                });
            }
        }
    }

    return result;
}

export { getWeightSnapshots };
