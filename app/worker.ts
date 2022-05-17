import express, { Express } from 'express';
import { tokenPriceService } from '../modules/token-price/token-price.service';
import { beetsService } from '../modules/beets/beets.service';
import { balancerService } from '../modules/balancer/balancer.service';
import { blocksSubgraphService } from '../modules/blocks-subgraph/blocks-subgraph.service';
import { balancerSubgraphService } from '../modules/balancer-subgraph/balancer-subgraph.service';

export function startWorker(app: Express) {
    /*const app = express();
    app.use(express.json());
    app.listen(port);*/

    app.get('/cache-token-prices', async (req, res) => {
        try {
            //3 times per minute
            for (let i = 0; i < 3; i++) {
                console.log('cache-token-prices ' + i);
                await tokenPriceService.cacheTokenPrices();
                await delay(20000);
            }
            res.status(200).send({ message: 'success' });
        } catch (e: any) {
            res.status(500).send({ message: e.message });
        }
    });

    app.get('/cache-historical-token-prices', async (req, res) => {
        try {
            console.log('cache-historical-token-prices');
            await tokenPriceService.cacheHistoricalTokenPrices();
            res.status(200).send({ message: 'success' });
        } catch (e: any) {
            res.status(500).send({ message: e.message });
        }
    });

    app.post('/cache-pools', async (req, res) => {
        try {
            //12 times per minute
            for (let i = 0; i < 12; i++) {
                console.log('cache-pools' + i);
                await balancerService.cachePools();
                await delay(5000);
            }
            await balancerService.cachePools();
            res.status(200).send({ message: 'success' });
        } catch (e: any) {
            res.status(500).send({ message: e.message });
        }
    });

    app.post('/cache-portfolio-pools-data', async (req, res) => {
        try {
            //2 times per minute
            for (let i = 0; i < 2; i++) {
                console.log('cache-portfolio-pools-data ' + i);
                const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
                await balancerSubgraphService.cachePortfolioPoolsData(parseInt(previousBlock.number));
                await delay(30000);
            }

            res.status(200).send({ message: 'success' });
        } catch (e: any) {
            res.status(500).send({ message: e.message });
        }
    });

    app.post('/cache-past-pools', async (req, res) => {
        try {
            //2 times per minute
            for (let i = 0; i < 2; i++) {
                console.log('cache-past-pools ' + i);
                await balancerService.cachePastPools();
                await delay(30000);
            }

            res.status(200).send({ message: 'success' });
        } catch (e: any) {
            res.status(500).send({ message: e.message });
        }
    });

    app.post('/cache-protocol-data', async (req, res) => {
        try {
            //2 times per minute
            for (let i = 0; i < 2; i++) {
                console.log('cache-protocol-data ' + i);
                await beetsService.cacheProtocolData();
                await delay(30000);
            }

            res.status(200).send({ message: 'success' });
        } catch (e: any) {
            res.status(500).send({ message: e.message });
        }
    });
}

async function delay(delayMilliseconds: number, timeoutFunc = setTimeout) {
    return new Promise((resolve) => timeoutFunc(resolve, delayMilliseconds));
}
