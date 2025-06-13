#!/bin/bash

# Example curl script to create an LBP via GraphQL mutation
# Replace the endpoint URL and input values as needed

GRAPHQL_ENDPOINT="http://localhost:4000/graphql"
POOL_ADDRESS="0x812C1217EA39c5242eD1C6D1015EbeD31261E28A"

# GraphQL mutation and variables
read -r -d '' QUERY << 'EOF'
{
  "query": "mutation CreateLBP($input: CreateLBPInput!) { createLBP(input: $input) }",
  "variables": {
    "input": {
      "poolContract": {
        "address": "0xa4f835f42fc6a0a4337290d9afe8d0b5082a69b1",
        "chain": "SEPOLIA"
      },
      "metadata": {
        "lbpName": "Example LBP Token",
        "description": "An example Liquidity Bootstrapping Pool for demonstration purposes",
        "website": "https://example.com",
        "tokenLogo": "https://assets.coingecko.com/coins/images/2518/large/weth.png"
      }
    }
  }
}
EOF

echo "Creating LBP for pool: $POOL_ADDRESS"
echo "Sending request to: $GRAPHQL_ENDPOINT"
echo ""

# Execute the curl request
curl -X POST \
  -H "Content-Type: application/json" \
  -d "$QUERY" \
  "$GRAPHQL_ENDPOINT" \
  | jq '.'

echo ""
echo "Note: Replace the saleToken.address with the actual token address from your LBP pool"
echo "Note: Ensure all URLs (website, logo, etc.) are accessible and return 200 status codes"
