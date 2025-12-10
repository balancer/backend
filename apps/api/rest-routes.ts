import { Express } from 'express';
import {
    beetsGetCirculatingSupply,
    beetsGetCirculatingSupplySonic,
    beetsGetTotalSupplySonic,
} from '../../modules/beets/lib/beets';

export function loadRestRoutes(app: Express) {
    app.use('/health', (_, res) => res.sendStatus(200));
    app.use('/circulating_supply', (_, res) => {
        beetsGetCirculatingSupply('FANTOM').then((result) => {
            res.send(result);
        });
    });
    app.use('/circulating_supply_sonic', (_, res) => {
        beetsGetCirculatingSupplySonic('SONIC').then((result) => {
            res.send(result);
        });
    });
    app.use('/total_supply_sonic', (_, res) => {
        beetsGetTotalSupplySonic('SONIC').then((result) => {
            res.send(result);
        });
    });
}
