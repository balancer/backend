import { Express } from 'express';
import { beetsGetCirculatingSupply, beetsGetTotalSupply } from '../../modules/beets/lib/beets';

export function loadRestRoutes(app: Express) {
    app.use('/health', (_, res) => res.sendStatus(200));
    app.use('/circulating_supply', (_, res) => {
        beetsGetCirculatingSupply('FANTOM').then((result) => {
            res.send(result);
        });
    });
    app.use('/circulating_supply_sonic', (_, res) => {
        beetsGetCirculatingSupply('SONIC').then((result) => {
            res.send(result);
        });
    });
    app.use('/total_supply_sonic', (_, res) => {
        beetsGetTotalSupply('SONIC').then((result) => {
            res.send(result);
        });
    });
}
