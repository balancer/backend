import { Express } from 'express';
import { beetsGetCirculatingSupply } from '../../modules/beets/lib/beets';

export function loadRestRoutes(app: Express) {
    app.use('/health', (_, res) => res.sendStatus(200));
    app.use('/circulating_supply', (_, res) => {
        beetsGetCirculatingSupply().then((result) => {
            res.send(result);
        });
    });
}
