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

    const snapshots = await prisma.quantWeights
        .findMany({
            where: {
                pool,
                chain,
                timestamp: { gte: from },
            },
            orderBy: { timestamp: 'asc' },
        })
        .then((snapshots) =>
            snapshots.map((s) => ({
                timestamp: s.timestamp,
                weights: [
                    s.weight1,
                    s.weight2,
                    s.weight3,
                    s.weight4,
                    s.weight5,
                    s.weight6,
                    s.weight7,
                    s.weight8,
                ].filter((w): w is number => w !== null && w !== undefined),
            })),
        );

    const result: any[] = [];
    const n = snapshots.length;
    let snapshotIndex = 0;
    let lastSnapshot: (typeof snapshots)[0] | undefined = undefined;

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

            // Initialize array of weight arrays
            const bucketWeights: number[][] = Array(2)
                .fill(null)
                .map(() => []);

            // Collect weights from each snapshot
            bucketSnapshots.forEach((s) => {
                // Access weights from the array instead of individual properties
                for (let i = 0; i < s.weights.length; i++) {
                    if (s.weights[i] !== undefined && s.weights[i] !== null) {
                        bucketWeights[i] ||= [];
                        bucketWeights[i].push(s.weights[i]);
                    }
                }
            });

            result.push({
                timestamp: t,
                weights: bucketWeights.map((weightArray) => avg(weightArray)),
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
                    weights: before.weights,
                });
            } else {
                const ratio = (t - before.timestamp) / (after.timestamp - before.timestamp);
                const interpolate = (a: number | null, b: number | null) =>
                    a != null && b != null ? a + (b - a) * ratio : a ?? b ?? null;
                result.push({
                    timestamp: t,
                    weights: before.weights.map((b, i) => interpolate(b, after.weights[i])),
                });
            }
        }
    }

    return result;
}

export { getWeightSnapshots };
