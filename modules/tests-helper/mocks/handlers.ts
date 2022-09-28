import { rest } from 'msw';

export const handlers = [
    //test containers
    rest.get('http://localhost/containers/*', async (req, res, ctx) => {
        return req.passthrough();
    }),
    rest.get('http://localhost/images/*', async (req, res, ctx) => {
        return req.passthrough();
    }),
    rest.post('http://localhost/containers/*', async (req, res, ctx) => {
        return req.passthrough();
    }),
    rest.delete('http://localhost/containers/*', async (req, res, ctx) => {
        return req.passthrough();
    }),
];
