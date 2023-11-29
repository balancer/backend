import { Express } from 'express';
import { beetsGetCirculatingSupply } from '../beets/lib/beets';
import { tokenService } from '../token/token.service';

export function loadRestRoutes(app: Express) {
    app.use('/health', (req, res) => res.sendStatus(200));
    app.use('/circulating_supply', (req, res) => {
        beetsGetCirculatingSupply().then((result) => {
            res.send(result);
        });
    });

    // app.use('/late-quartet', async (req, res) => {
    //     const tokenPrices = await tokenService.getTokenPrices();

    //     res.send({
    //         bptPrice: tokenService.getPriceForToken(tokenPrices, '0xf3a602d30dcb723a74a0198313a7551feaca7dac'),
    //     });
    // });
}
