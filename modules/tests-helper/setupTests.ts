import { startTestDb, TestDatabaseContainer } from './jest-test-helpers';
import { server } from './mocks/server';
let db: TestDatabaseContainer;

beforeAll(async () => {
    db = await startTestDb();
    server.listen();
}, 60000);

// Clean up after the tests are finished.
afterAll(async () => {
    db.stop();
    server.close();
});
