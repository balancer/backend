import { rest } from 'msw';
import { networkConfig } from '../../config/network-config';

export const rpcHandlers = [
    //RPC requests
    rest.post(networkConfig.rpcUrl, async (req, res, ctx) => {
        const body = await req.json();
        // initial request by ethers to detect chain
        if (body.method === 'eth_chainId') {
            return res(
                ctx.status(200),
                ctx.json({
                    id: body.id,
                    jsonrpc: body.jsonrpc,
                    result: '0x' + networkConfig.chain.id.toString(16),
                }),
            );
        }
        if (body.method === 'net_version') {
            return res(
                ctx.status(200),
                ctx.json({
                    id: body.id,
                    jsonrpc: body.jsonrpc,
                    result: networkConfig.chain.id.toString(),
                }),
            );
        }
        //read contract
        if (body.method === 'eth_call') {
            if (body.params[0].to === networkConfig.fbeets!.address) {
                //assume call for total supply
                return res(
                    ctx.status(200),
                    ctx.json({
                        id: body.id,
                        jsonrpc: body.jsonrpc,
                        result: '0x0000000000000000000000000000000000000000000010000000000000000000',
                    }),
                );
            }
            if (body.params[0].to === networkConfig.fbeets!.poolAddress) {
                //assume call for bpt balance
                return res(
                    ctx.status(200),
                    ctx.json({
                        id: body.id,
                        jsonrpc: body.jsonrpc,
                        result: '0x0000000000000000000000000000000000000000000020000000000000000000',
                    }),
                );
            }
        }
        // write contract
        if (body.method === 'eth_signTransaction') {
        }
        console.log('returning default 0x0 response');
        return res(
            ctx.status(200),
            ctx.json({
                id: body.id,
                jsonrpc: body.jsonrpc,
                result: '0x00',
            }),
        );
    }),
];
