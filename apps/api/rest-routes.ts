import { Express } from 'express';
import {
    beetsGetCirculatingSupply,
    beetsGetCirculatingSupplySonic,
    beetsGetTotalSupplySonic,
} from '../../modules/beets/lib/beets';
import { latestTokenPrice } from '../../modules/token/latest-token-price';
import config from '../../config';
import { Chain } from '@prisma/client';
import * as crypto from 'crypto';

const isHexAddress = (addr: any) =>
    typeof addr === 'string' && addr.length === 42 && addr.startsWith('0x') && /^[0-9a-f]{40}$/i.test(addr.slice(2));

export function loadRestRoutes(app: Express) {
    app.use('/health', (_, res) => res.sendStatus(200));
    app.use('/circulating_supply', (_, res) => {
        beetsGetCirculatingSupply().then((result) => {
            res.send(result);
        });
    });
    app.use('/circulating_supply_sonic', (_, res) => {
        beetsGetCirculatingSupplySonic().then((result) => {
            res.send(result);
        });
    });
    app.use('/total_supply_sonic', (_, res) => {
        beetsGetTotalSupplySonic().then((result) => {
            res.send(result);
        });
    });

    app.get('/price', async (req, res) => {
        res.type('application/json');

        const chain = req.query.chain;
        const tokens = req.query.tokens && (req.query.tokens as string).split(',');

        // Validate params
        if (typeof chain !== 'string' || !(chain in config)) {
            res.status(400).end();
            return;
        }

        if (!Array.isArray(tokens) || tokens.length === 0 || !tokens.every(isHexAddress) || tokens.length > 8) {
            res.status(400).end();
            return;
        }

        const prices = await latestTokenPrice(chain as Chain, tokens as string[]);

        // Build response body
        const responseBody = { prices };
        const bodyString = JSON.stringify(responseBody);

        // Generate strong ETag: MD5 hash of the body (fast for small JSON)
        const etag = crypto.createHash('md5').update(bodyString).digest('hex');

        // Set ETag header
        res.set('ETag', `"${etag}"`);

        // Check for conditional request
        const clientEtag = req.get('If-None-Match');
        if (clientEtag === `"${etag}"` || clientEtag === etag) {
            // Handle quoted/unquoted client headers
            res.status(304).end(); // Not modified: No body needed
            return;
        }

        // Set caching headers (unchanged)
        res.set('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=30, stale-if-error=86400');

        // Send full response
        res.send(responseBody);
    });
}
