#!/bin/bash

# Script para obter o Installation ID do GitHub App
# Substitua as variáveis abaixo com seus dados

GITHUB_APP_ID="2838507"
GITHUB_PRIVATE_KEY_FILE="/home/fnascime/Downloads/mini_serv/n8n-org-helper.2026-01-12.private-key.pem"
ORGANIZATION="B42-Product-Automation"

echo "🔍 Buscando Installation ID para a organização: $ORGANIZATION"

# Gera JWT token (requer 'jq' instalado)
if ! command -v jq &> /dev/null; then
    echo "❌ Este script requer 'jq'. Instale com: sudo apt install jq"
    exit 1
fi

# Cria payload JWT
header=$(echo -n '{"alg":"RS256","typ":"JWT"}' | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
now=$(date +%s)
iat=$((now - 60))
exp=$((now + 600))
payload=$(echo -n "{\"iat\":$iat,\"exp\":$exp,\"iss\":\"$GITHUB_APP_ID\"}" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

# Assina o JWT
signature=$(echo -n "$header.$payload" | openssl dgst -sha256 -sign "$GITHUB_PRIVATE_KEY_FILE" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
jwt="$header.$payload.$signature"

echo "✅ JWT gerado com sucesso"

# Busca installations
echo "🔍 Buscando installations..."
response=$(curl -s -H "Authorization: Bearer $jwt" \
               -H "Accept: application/vnd.github.v3+json" \
               https://api.github.com/app/installations)

echo "🔍 Resposta bruta da API:"
echo "$response"
echo ""

echo "📋 Installations encontradas:"
if echo "$response" | jq empty 2>/dev/null; then
    echo "$response" | jq -r '.[] | "ID: \(.id) - Account: \(.account.login) - Type: \(.account.type)"'
else
    echo "❌ Erro no JSON ou resposta de erro da API"
    echo "Resposta: $response"
fi

echo ""
echo "🎯 Para sua organização '$ORGANIZATION':"
installation_id=$(echo "$response" | jq -r ".[] | select(.account.login == \"$ORGANIZATION\") | .id")

if [ "$installation_id" != "null" ] && [ -n "$installation_id" ]; then
    echo "✅ Installation ID encontrado: $installation_id"
else
    echo "❌ Installation ID não encontrado para a organização '$ORGANIZATION'"
    echo "   Verifique se o app está instalado na organização correta"
fi
