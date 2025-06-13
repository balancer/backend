import { Chain, PoolEventType } from '@prisma/client';
import { eventsRepository } from './events-repository';

type CommandHandler = (args: string[]) => Promise<unknown>;

interface Command {
    description: string;
    handler: CommandHandler;
}

const commands: Record<string, Command> = {
    getEvents: {
        description: 'Get events with optional filters',
        handler: async (args: string[]) => {
            const chain = args[0] as Chain;
            const poolId = args[1] !== undefined ? args[1] : undefined;
            const userAddress = args[2] !== undefined ? args[2] : undefined;
            const limit = args[3] !== undefined ? parseInt(args[3], 10) : undefined;
            const offset = args[4] !== undefined ? parseInt(args[4], 10) : undefined;

            return eventsRepository.getEvents({
                chain,
                poolId,
                userAddress,
                limit,
                offset,
            });
        },
    },
    getLatestEvent: {
        description: 'Get the latest event with optional filters',
        handler: async (args: string[]) => {
            const chain = args[0] as Chain;
            const protocolVersion =
                args[1] !== undefined && args[1] !== 'undefined' ? parseInt(args[1], 10) : undefined;
            const types =
                args[2] !== undefined && args[2] !== 'undefined' ? (args[2].split(',') as PoolEventType[]) : undefined;
            const timestamp = args[3] !== undefined ? parseInt(args[3], 10) : undefined;

            return eventsRepository.getLatestEvent({
                chain,
                protocolVersion,
                types,
                timestamp,
            });
        },
    },
    getSwapStats: {
        description: 'Get swap statistics',
        handler: async (args: string[]) => {
            const chain = args[0] as Chain;
            const poolIds = args[1] !== undefined ? args[1].split(',') : undefined;
            const since = parseInt(args[2], 10);

            return eventsRepository.getSwapStats({
                chain,
                poolIds,
                since,
            });
        },
    },
    getDailyBlockNumbers: {
        description: 'Get daily block numbers',
        handler: async (args: string[]) => {
            const chain = args[0] as Chain;
            const days = parseInt(args[1], 10);

            return eventsRepository.getDailyBlockNumbers(chain, days);
        },
    },
    getTokenFlows: {
        description: 'Get token flows for a specific pool and token pair',
        handler: async (args: string[]) => {
            const chain = args[0] as Chain;
            const poolId = args[1];
            const projectTokenAddress = args[2];
            const reserveTokenAddress = args[3];
            const interval = (args[4] && Number(args[4])) || undefined;

            if (!poolId || !chain || !projectTokenAddress || !reserveTokenAddress) {
                throw new Error('Missing required arguments: poolId, chain, projectTokenAddress, reserveTokenAddress');
            }

            return eventsRepository.getTokenFlows(chain, poolId, projectTokenAddress, reserveTokenAddress, interval);
        },
    },
};

function printUsage() {
    console.log('Usage: ts-node cli.ts <command> [args...]');
    console.log('\nAvailable commands:');

    Object.entries(commands).forEach(([cmdName, cmd]) => {
        console.log(`  ${cmdName}: ${cmd.description}`);
    });

    console.log('\nExamples:');
    console.log('  ts-node cli.ts getEvents MAINNET "0x12345..." undefined 100 0');
    console.log('  ts-node cli.ts getLatestEvent MAINNET undefined "SWAP,JOIN,EXIT"');
    console.log('  ts-node cli.ts getSwapStats MAINNET "0x12345...,0xabcde..." 1640995200');
    console.log('  ts-node cli.ts getDailyBlockNumbers MAINNET 30');
    console.log('  ts-node cli.ts getTokenFlows MAINNET "0x12345..." "0xProjectToken..." "0xReserveToken..."');
}

async function cli(command: string, args: string[]) {
    if (!command || !commands[command]) {
        printUsage();
        return;
    }

    try {
        const result = await commands[command].handler(args);
        return result;
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
}

// Parse command-line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

if (command) {
    cli(command, args)
        .then((result) => console.log(JSON.stringify(result, null, 2)))
        .catch((error) => console.error('Error:', error))
        .finally(() => process.exit(0));
} else {
    printUsage();
    process.exit(1);
}
