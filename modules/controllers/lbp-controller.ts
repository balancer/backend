import { Chain } from '@prisma/client';
import { getViemClient } from '../sources/viem-client';
import { syncData } from '../actions/lbp/sync-data';
import config from '../../config';
import { syncDataFixedLBP } from '../actions/lbp/sync-data-fixedLBP';
import { prisma } from '../../prisma/prisma-client';
import { LBPoolData, FixedLBPData } from '../pool/pool-data';
import { priceChartData } from '../pool/lbp/price-chart-data';
import { priceChartDataFixedLBP } from '../pool/lbp/fixed-lbp-price-chart-data';

export const LBPController = {
    async syncData(chain: Chain) {
        const client = getViemClient(chain);
        const vaultAddress = config[chain].balancer.v3.vaultAddress;
        if (!vaultAddress) return;

        await syncData(chain, client, vaultAddress);
    },
    async syncDataFixedLBP(chain: Chain) {
        const client = getViemClient(chain);

        await syncDataFixedLBP(chain, client);
    },
    async lbpPriceChart(poolId: string, chain: Chain, dataPoints?: number) {
        try {
            const pool = await prisma.prismaPool.findFirst({
                where: {
                    id: poolId,
                    chain,
                    type: 'LIQUIDITY_BOOTSTRAPPING',
                    protocolVersion: 3,
                },
            });
            if (!pool) {
                throw new Error('Pool with id does not exist');
            }
            const input = {
                id: pool.id,
                chain: pool.chain,
                createTime: pool.createTime,
                ...(pool.typeData as LBPoolData),
            };

            const chartData = await priceChartData(input, dataPoints || undefined);

            return chartData.map((d) => ({ ...d, intervalTimestamp: d.timestamp }));
        } catch (error) {
            console.error('Error fetching LB Pool chart:', error);
            return null;
        }
    },
    async fixedLbpPriceChart(poolId: string, chain: Chain, dataPoints?: number) {
        try {
            const pool = await prisma.prismaPool.findFirst({
                where: {
                    id: poolId,
                    chain,
                    type: 'FIXED_LBP',
                    protocolVersion: 3,
                },
            });
            if (!pool) {
                throw new Error('Pool with id does not exist');
            }
            const input = {
                id: pool.id,
                chain: pool.chain,
                createTime: pool.createTime,
                ...(pool.typeData as FixedLBPData),
            };

            const chartData = await priceChartDataFixedLBP(input, dataPoints || undefined);

            return chartData.map((d) => ({ ...d, intervalTimestamp: d.timestamp }));
        } catch (error) {
            console.error('Error fetching LB Pool chart:', error);
            return null;
        }
    },
};
