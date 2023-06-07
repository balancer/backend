# Beethoven X Backend

# Contributions

## Project setup

### Prepare .env file

Rename `env.local` file to `.env`.

For the sanity content to work, you need to set
the `SANITY_API_TOKEN`.

### Generate gql types

There are 2 kinds of graphql types to generate. We have types for interacting with the different subgraphs, and the types
for our exposed graphql api schema.
Run `yarn generate` to generate all gql types

### Setup empty database & Prisma

#### Start docker container and manually set up your database (For setup from backup, read below)

First we need to spin up the database, there is a `docker-compose` file with a postgres
database configured. Spin it up by running `docker-compose up -d`.

#### Apply prisma migrations

Run `yarn prisma migrate dev` to apply all database migrations.

#### Generate prisma client

Run `yarn prisma generate` to generate the prisma client. Usually this is already
done by applying the migrations

#### Run mutations to initialize fill database with intial data

Trigger the following mutations when you start from a clean DB:

```
poolSyncAllPoolsFromSubgraph
poolReloadStakingForAllPools
userInitWalletBalancesForAllPools
userInitStakedBalances
```

### Setup database & Prisma from backup

Retrieve the current pg_dump file under `https://api-db-dump.s3.eu-central-1.amazonaws.com/canary/api-dump.YYYYMMDD`.
Database dumps are kept for the previous 7 days, replace YYYYMMDD in the URL above (ie: 20230317)  to download a db dump.

Run `docker-compose up -d` to start the database via docker compose.

Retrieve the docker container ID through `docker ps`.

Run `docker exec -i <container-ID> /bin/bash -c "PGPASSWORD=let-me-in psql --username backend database" < /path/on/your/machine/dump`
with the container-ID from the step before.

The output at the very end saying `ERROR: role "rdsadmin" does not exist` is normal and can be ignored.

## Run locally

`yarn start:local`

## Branching and deployment environments

We run a canary and a production (called main) deployment environment.
The canary environment is built from the `v2-canary` branch and the production deployment
is built from the `v2-main` branch. The environments can be accessed through the following links:

https://backend-v2.beets-ftm-node.com/graphql

https://backend-v2-canary.beets-ftm-node.com/graphql

https://backend-optimism-v2.beets-ftm-node.com/graphql

https://backend-optimism-v2-canary.beets-ftm-node.com/graphql

## Contributing

We follow the model of [gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) using the following naming for branches:

-   main: v2-main
-   development: v2-canary
-   feature: feature/\*
-   release: release/\*
-   hotfix: hf/\*

To contribute, branch from `v2-canary` (which is our development branch) and open a PR against `v2-canary` once the feature is complete. It will be reviewed and eventually merged into v2-canary.

### Database Updates

If you make any changes to the database schema be sure to run `yarn prisma migrate dev --name <change_name>` which will create a new file in `prisma/migrations` that contains all the database changes you've made as an SQL update script. 