import { YbAprHandlers } from '../handlers';
import cnfg from '../../../config';

const main = async (_chain: string) => {
    const chain = _chain as keyof typeof cnfg;
    const config = cnfg[chain].aprHandlers.ybAprHandler;
    const handler = new YbAprHandlers(config!, chain);

    return handler.fetchAprsFromAllHandlers();
};

main(process.argv[2])
    .then(console.log)
    .catch(console.log)
    .finally(() => process.exit(0));
