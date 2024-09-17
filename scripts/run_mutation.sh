#!/bin/bash

# Ensure the mutation query and chainId are passed as arguments
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 '<mutation_query>' '<chainId>'"
  exit 1
fi

MUTATION_QUERY=$1
CHAIN_ID=$2
ADMIN_API_KEY=$(grep '^ADMIN_API_KEY=' .env | cut -d '=' -f2)

# Execute the curl command with the provided mutation query and chainId
curl -d "{\"query\":\"mutation { $MUTATION_QUERY }\"}" -H 'Content-Type: application/json' -H "chainId: $CHAIN_ID" -H "AdminApiKey: $ADMIN_API_KEY" http://localhost:4000/graphql