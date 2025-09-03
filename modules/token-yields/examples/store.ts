import { TokenYieldsService } from '../service';
import cnfg from '../../../config';

const main = async (_chain: string) => {
    const chain = _chain as keyof typeof cnfg;
    const config = cnfg[chain].aprHandlers.ybAprHandler;
    const service = new TokenYieldsService();

    return service.fetchAndStoreYields(config!, chain);
};

main(process.argv[2])
    .then(console.log)
    .catch(console.log)
    .finally(() => process.exit(0));
