import { Express } from 'express';

export function loadRestRoutesBalancer(app: Express) {
    app.use('/health', (req, res) => res.sendStatus(200));
}
