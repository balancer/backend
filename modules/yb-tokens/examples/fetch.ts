import { YbAprHandlers } from '../handlers';
import mainnet from '../../../config/mainnet';

const config = mainnet.aprHandlers.ybAprHandler;
const handler = new YbAprHandlers(config!, 'MAINNET');

handler
    .fetchAprsFromAllHandlers()
    .then(console.log)
    .finally(() => process.exit(0));
