import { TokenYieldAprHandlers } from '../handlers';
import cnfg from '../../../config';

const main = async (_chain: string) => {
    const chain = _chain as keyof typeof cnfg;
    const config = cnfg[chain].aprHandlers.ybAprHandler;
    const handler = new TokenYieldAprHandlers(config!, chain);

    return handler.fetchAprsFromAllHandlers();
};

main(process.argv[2])
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch(console.log)
    .finally(() => process.exit(0));
