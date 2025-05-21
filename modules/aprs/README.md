# APR Calculation Module

This module provides a new implementation for pool APR calculations with improved separation of concerns and flexibility.

## Key Features

-   Decoupling of database operations from APR calculations
-   Ability to calculate APRs without writing to the database (for testing/debugging)
-   Only writes to the database when APR values change
-   Support for individual pool updates
-   Clear separation of responsibilities with the Repository pattern
-   Declarative configuration for chain-specific calculators

## Architecture

The module follows a layered architecture:

1. **Repository Layer** - Handles data access (`PoolAprRepository`)
2. **Handlers Layer** - Contains pure calculation logic (`AprHandler` implementations)
3. **Configuration Layer** - Defines which calculators to use for each chain
4. **Manager Layer** - Coordinates calculators and persistence (`AprManager`)
5. **Service Layer** - Provides the public API (`AprService`)

## Usage

### Basic Usage

```typescript
import { AprService } from '../modules/aprs';
import { Chain } from '@prisma/client';

// Update APRs for all pools on a chain
const aprService = new AprService();
await aprService.updateAprs('MAINNET' as Chain);

// Update APR for a single pool
await aprService.updateAprForPool('MAINNET' as Chain, 'pool-id-here');
```

### Debugging/Testing

```typescript
// Calculate APRs without writing to database
const aprData = await aprService.calculateAprForPool('MAINNET' as Chain, 'pool-id-here');
console.log('APR Items:', aprData);
```

### Reload All APRs

```typescript
// Delete all existing APR items and recalculate
await aprService.reloadAllPoolAprs('MAINNET' as Chain);
```

## Testing

There is a simple test script provided in `examples/integration.ts` that can be used to test the module:

```
bun run modules/examples/integration.ts MAINNET 0x1234...
```

## Development

### Calculator Configuration

The module uses a declarative approach to configure which handlers are used for each chain:

1. **Configuration Definition**: Each chain has a object with handlers configuration
2. **Calculator Factories**: Factory functions create calculator instances with the right parameters

This approach makes it easy to:

-   Add or remove calculators for specific chains
-   Configure calculator parameters
-   Understand at a glance which chains use which handlers

### Adding New Handlers

1. Create a new folder in the `handlers` directory
2. Implement the required methods
3. Add the handler to the `createHandlers` method in `handlers` folder

```typescript
// Example calculator implementation
export class MyNewAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'MyNewAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolForAPRs[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        // Your calculation logic here
        return [];
    }
}
```
