import { subgraphMetricPublisher } from '../metrics/metrics.client';
import networkConfigs from '../../config';
import { chainIdToChain } from '../../config/chain-id-to-chain';
import { GaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { getViemClient } from '../sources/viem-client';

export function SubgraphMonitorController(tracer?: any) {
    return {
        async postSubgraphLagMetrics() {
            for (const [id, chain] of Object.entries(chainIdToChain)) {
                const networkData = networkConfigs[chain];

                const viemClient = getViemClient(networkData.chain.prismaId);

                for (const [subgraphName, subgraphUrl] of Object.entries(networkData.subgraphs)) {
                    if (
                        !subgraphUrl.includes('thegraph') &&
                        !subgraphUrl.includes('goldsky') &&
                        !subgraphUrl.includes('ormi')
                    ) {
                        continue;
                    }

                    const latestBlock = await viemClient.getBlockNumber();
                    let lag = 0;
                    try {
                        const subgraph = new GaugeSubgraphService(subgraphUrl as string);

                        const blockNumber = await subgraph.lastSyncedBlock();
                        lag = Math.max(Number(latestBlock) - blockNumber, 0);

                        let subgraphUrlClean = subgraphUrl;
                        if (subgraphUrl.includes('gateway')) {
                            const parts = subgraphUrl.split('/');
                            parts.splice(4, 1);
                            subgraphUrlClean = parts.join('/');
                        }

                        subgraphMetricPublisher.publish(
                            `${networkData.chain.slug}-${subgraphName}-lag-${subgraphUrlClean}`,
                            lag,
                        );
                    } catch (e) {
                        console.log(`Error fetching subgraph lag for ${subgraphName} on ${networkData.chain.slug}`);
                    }
                }
            }
        },
    };
}
