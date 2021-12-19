import { Express } from 'express';
import { getCirculatingSupply } from '../modules/beets/beets';

export function loadRestRoutes(app: Express) {
    app.use('/health', (req, res) => res.sendStatus(200));
    app.use('/circulating_supply', (req, res) => {
        getCirculatingSupply().then((result) => {
            res.send(result);
        });
    });
}
