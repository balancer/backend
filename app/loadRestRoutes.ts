import { Express } from 'express';
import { beetsGetCirculatingSupply } from '../modules/beets/src/beets';
import { balancerService } from '../modules/balancer/balancer.service';

export function loadRestRoutes(app: Express) {
    app.use('/health', (req, res) => res.sendStatus(200));
    app.use('/circulating_supply', (req, res) => {
        beetsGetCirculatingSupply().then((result) => {
            res.send(result);
        });
    });

    app.use('/late-quartet', async (req, res) => {
        res.send({
            bptPrice: await balancerService.getLateQuartetBptPrice(),
        });
    });
}
