import { setupServer } from 'msw/node';
import { testcontainerHandlers } from './testcontainerHandlers';

export const mockServer = setupServer(...testcontainerHandlers);
