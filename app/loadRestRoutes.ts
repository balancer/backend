import { Express } from 'express';
import { beetsService } from '../modules/beets/beets.service';

export function loadRestRoutes(app: Express) {
    app.use('/health', (req, res) => res.sendStatus(200));
    app.use('/circulating_supply', (req, res) => {
        beetsService.getCirculatingSupply().then((result) => {
            res.send(result);
        });
    });
}
