# APR Module Structure

This document outlines the structure and components of the new APR module.

## Core Components

### 1. Interfaces

-   **AprHandler**: Defines the contract for APR calculators
    -   `calculateAprForPools`: Calculates APR items for pools
    -   `getAprServiceName`: Returns the name of the calculator

### 2. Repository

-   **AprRepository**: Handles all database operations
    -   Getting pools data for calculations
    -   Saving APR items
    -   Updating total APR values
    -   Deleting APR data

### 3. Handlers

-   **SwapFeeAprHandler**: Calculates swap fee APR
-   **BoostedPoolAprCalculator**: Calculates boosted pool APR

### 4. Manager

-   **AprManager**: Coordinates calculators and persistence
    -   Orchestrates the calculation process
    -   Manages database operations through the repository
    -   Handles error reporting

### 5. Configuration

-   **ChainConfig**: Defines which calculators to use for each chain
-   **Configuration Approach**: Declarative configuration for easy maintenance

### 6. Service

-   **AprService**: Main entry point for APR operations
    -   Uses configuration to create appropriate calculators for each chain
    -   Provides public methods for updating APRs
    -   Supports calculation without persistence

## Data Flow

1. Client calls `AprService`
2. `AprService` gets chain-specific handlers configuration
3. Handler factory creates the appropriate handler instances
4. `AprManager` coordinates the calculation process:
    - Fetches required data through the repository
    - Executes calculations using handlers
    - Aggregates results
    - Persists results through the repository (if needed)
5. Results are returned to the client

## Configuration

-   Chain-specific configurations for handlers is defined in `config/`
-   Easy to update which handlers are used for which chains

## Key Features

-   Separation of concerns (calculation vs. persistence)
-   Support for individual pool updates
-   Calculation without persistence for testing
-   Only writing to the database when values change
-   Clear error handling and reporting
-   Declarative configuration of chain-specific calculators
-   Factory pattern for calculator instantiation
