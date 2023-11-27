#!/bin/sh
secrets=$(aws secretsmanager get-secret-value --secret-id api-secrets --region $AWS_REGION | jq -r '.SecretString')

IFS=$'\n' read -r -d '' -a keys <<< "$(echo $secrets | jq -r 'keys[]')"

touch .env
chown webapp:webapp .env
for key in "${keys[@]}"; do
  value=$(echo $secrets | jq -r ".\"$key\"")
  printf "%s=%s\n" "$key" "$value"
done > .env
