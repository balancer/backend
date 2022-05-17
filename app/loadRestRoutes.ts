import { Express } from 'express';

export function loadRestRoutes(app: Express) {
    app.use('/health', (req, res) => res.sendStatus(200));
}
