import { TokenYieldAprHandlers } from '../handlers';
import cnfg from '../../../config';

const main = async (_chain: string) => {
    const chain = _chain as keyof typeof cnfg;
    const config = cnfg[chain].aprHandlers.ybAprHandler;
    const handler = new TokenYieldAprHandlers(config!, chain);

    const aprs = await handler.fetchAprsFromAllHandlers();

    return aprs.filter((a) => a.source === 'aave');
};

main(process.argv[2])
    .then(console.log)
    .catch(console.log)
    .finally(() => process.exit(0));
