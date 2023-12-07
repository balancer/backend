#!/bin/sh
# In case we merge two env secrets into a flattened one in the same region
# secrets=$(aws secretsmanager get-secret-value --secret-id api-secrets --region $AWS_REGION | jq -r '.SecretString')

# IFS=$'\n' read -r -d '' -a key_value_pairs <<< "$(echo $secrets | jq -r --arg prefix "$PREFIX" 'to_entries[] | select((.key | ascii_upcase) | startswith(($prefix+"_") | ascii_upcase)) | ((.key | sub(($prefix+"_"); ""; "i")) + "=" + .value)')"

# for pair in "${key_value_pairs[@]}"; do
#   echo "$pair"
# done

secrets=$(aws secretsmanager get-secret-value --secret-id api-secrets --region $AWS_REGION | jq -r '.SecretString')

IFS=$'\n' read -r -d '' -a keys <<< "$(echo $secrets | jq -r 'keys[]')"

touch /var/app/staging/.env
chown webapp:webapp /var/app/staging/.env
for key in "${keys[@]}"; do
  value=$(echo $secrets | jq -r ".\"$key\"")
  printf "%s=%s\n" "$key" "$value"
done >> /var/app/staging/.env
