import { rest } from 'msw';

export const testcontainerHandlers = [
    //testcontainers
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
