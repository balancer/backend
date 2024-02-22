### Architecture

The API is a monolith designed to cover 2 main functions:

1. Serve graphql API with cached onchain state of pool and user data designed around frontend needs. It has 3 components:
    - Jobs queue scheduler – is pushing jobs to the queue on cron schedule
    - Jobs handler – executes ETL actions
    - Server – serves graphql schema for reading
2. Provide SOR for liquidity on Balancer. It's route finding is based on BSF on the pools directed graph where nodes are the tokens and edges are triads: [pool.id, tokenIn, tokenOut].

#### Structural Layers

Excalidraw diagram: app-architecture.excalidraw

**/modules/controllers**
Controllers are resposible for creating context from configuration, eg: setting up external data sources or passing required configs to the actions. It's the entry point for executing logic based on the users / cron requests.

**/modules/actions**
This directory contains the code that orchestrates the ETL process, calling the appropriate functions from the sources, transformers, and stores directories. This is the main logic of the ETL process.

**/modules/sources**
Sources is the external data access layer, it's responsible for extracting data from 3 main sources:

1. Subgraph – responsible for static data with low frequency updates
2. Contracts – used for quering real time data
3. Logs – extracting events for direct indexing skipping subgraph

The extracted data is then passed on to the transform functions for DB format mapping.

**/modules/sources/transformers**
Transformers are responsible for converting the extracted data format into DB expected one. This could involve cleaning the data, filtering it, aggregating it, or applying business rules. The transformed data is then passed on to the Stores for loading into the DB.

**Application data access layer**
Prisma ORM to abstract the DB.
