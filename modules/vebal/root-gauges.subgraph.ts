import { Chain } from '@prisma/client';
import { keyBy } from 'lodash';

import { RootGauge } from './root-gauges.onchain';
import { mainnetNetworkConfig } from '../network/mainnet';
import { GraphQLClient } from 'graphql-request';
import { getSdk } from '../subgraphs/gauge-subgraph/generated/gauge-subgraph-types';

type SubGraphRootGauge = {
    gaugeAddress: string;
    chain: Chain;
    recipient?: string;
};

//TODO: use generic gauge-subgraph-service instead
const subgraphClient = getSdk(new GraphQLClient(mainnetNetworkConfig.data.subgraphs.gauge!));

export async function fetchRootGaugesFromSubgraph(onchainRootAddresses: string[]) {
    const rootGauges = (await subgraphClient.RootGauges({ ids: onchainRootAddresses })).rootGauges;

    const l2RootGauges: SubGraphRootGauge[] = rootGauges.map((gauge) => {
        return {
            gaugeAddress: gauge.id,
            chain: gauge.chain.toUpperCase() as Chain,
            recipient: gauge.recipient,
        } as SubGraphRootGauge;
    });

    const liquidityGauges = (await subgraphClient.LiquidityGauges({ ids: onchainRootAddresses })).liquidityGauges;

    const mainnetRootGauges: SubGraphRootGauge[] = liquidityGauges.map((gauge) => {
        return {
            gaugeAddress: gauge.id,
            chain: Chain.MAINNET,
            recipient: undefined,
        } as SubGraphRootGauge;
    });

    return [...l2RootGauges, ...mainnetRootGauges];
}

export function updateOnchainGaugesWithSubgraphData(onchainGauges: RootGauge[], subgraphGauges: SubGraphRootGauge[]) {
    const subgraphGaugesByAddress = keyBy(subgraphGauges, 'gaugeAddress');

    return onchainGauges.map((gauge) => {
        const rootGauge = gauge;
        const subGraphGauge = subgraphGaugesByAddress[gauge.gaugeAddress];
        if (subGraphGauge) {
            rootGauge.isInSubgraph = true;
            rootGauge.network = subGraphGauge.chain;
            rootGauge.recipient = subGraphGauge.recipient;
        }
        return rootGauge;
    });
}
