import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { commandSync } from 'execa';

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

export type TestDatabase = {
    postgres: StartedTestContainer;
    prisma: PrismaClient;
    stop: () => Promise<void>;
};

export type TestDatabasePrismaConfig = {
    generateClient: boolean;
    schemaFile: string;
};

export type TestDatabaseConfig = {
    user: string;
    password: string;
    dbName: string;
};

const defaultTestDatabaseConfig: TestDatabaseConfig = {
    user: 'beetx',
    password: 'let-me-in',
    dbName: 'beetx',
};

const defaultTestDatabasePrismaConfig: TestDatabasePrismaConfig = {
    generateClient: true,
    schemaFile: path.join(__dirname, '../../prisma/schema.prisma'),
};

export async function createTestDb(
    prismaConfig: TestDatabasePrismaConfig = defaultTestDatabasePrismaConfig,
    dbConfig: TestDatabaseConfig = defaultTestDatabaseConfig,
): Promise<TestDatabase> {
    try {
        const postgres = await new GenericContainer('postgres')
            .withEnv('POSTGRES_USER', dbConfig.user)
            .withEnv('POSTGRES_PASSWORD', dbConfig.password)
            .withEnv('POSTGRES_DB', dbConfig.dbName)
            .withExposedPorts(5432)
            .start();

        const schema = `test_${uuidv4()}`;
        const connectionString = `postgresql://${dbConfig.user}:${
            dbConfig.password
        }@${postgres.getHost()}:${postgres.getMappedPort(5432)}/${dbConfig.dbName}?schema=${schema}`;

        commandSync(`yarn prisma db push --schema ${prismaConfig.schemaFile} --skip-generate`, {
            env: {
                DATABASE_URL: connectionString,
            },
        });
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: connectionString,
                },
            },
        });

        return {
            postgres,
            prisma,
            stop: async () => {
                await prisma.$disconnect();
                await postgres.stop();
            },
        };
    } catch (error) {
        console.error('Error spinning up test database', error);
        throw error;
    }
}
