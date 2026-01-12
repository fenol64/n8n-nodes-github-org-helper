#!/bin/bash

# Script para testar autenticação do GitHub App
# Preencha as variáveis abaixo com seus dados reais

GITHUB_APP_ID="2638557"
GITHUB_INSTALLATION_ID="103756438"
GITHUB_PRIVATE_KEY_FILE="/home/fnascime/Downloads/mini_serv/n8n-org-helper.2026-01-12.private-key.pem"

echo "🔧 Testando autenticação do GitHub App..."
echo "📋 App ID: $GITHUB_APP_ID"
echo "📋 Installation ID: $GITHUB_INSTALLATION_ID"

# Valida se App ID é um número
if ! [[ "$GITHUB_APP_ID" =~ ^[0-9]+$ ]]; then
    echo "❌ App ID deve ser apenas números"
    exit 1
fi

# Valida se Installation ID é um número
if ! [[ "$GITHUB_INSTALLATION_ID" =~ ^[0-9]+$ ]]; then
    echo "❌ Installation ID deve ser apenas números"
    exit 1
fi

# Verifica se o arquivo de chave privada existe
if [ ! -f "$GITHUB_PRIVATE_KEY_FILE" ]; then
    echo "❌ Arquivo de chave privada não encontrado: $GITHUB_PRIVATE_KEY_FILE"
    echo "💡 Dica: Faça download da chave privada do GitHub App e ajuste o caminho"
    exit 1
fi

echo "✅ Arquivo de chave privada encontrado"

# Verifica o formato da chave privada
echo "🔍 Verificando formato da chave privada..."
first_line=$(head -n 1 "$GITHUB_PRIVATE_KEY_FILE")
last_line=$(tail -n 1 "$GITHUB_PRIVATE_KEY_FILE")

echo "   Primeira linha: $first_line"
echo "   Última linha: $last_line"

if [[ ! "$first_line" =~ "BEGIN" ]] || [[ ! "$last_line" =~ "END" ]]; then
    echo "❌ Formato da chave privada incorreto"
    echo "   A chave deve começar com -----BEGIN e terminar com -----END"
    exit 1
fi

echo "✅ Formato da chave privada correto"

# Verifica se jq está instalado
if ! command -v jq &> /dev/null; then
    echo "❌ 'jq' não está instalado. Instale com: sudo apt install jq"
    exit 1
fi

# Gera JWT token
echo "🔑 Gerando JWT token..."
header='{"alg":"RS256","typ":"JWT"}'
now=$(date +%s)
iat=$((now - 60))
exp=$((now + 600))
payload="{\"iat\":$iat,\"exp\":$exp,\"iss\":\"$GITHUB_APP_ID\"}"

echo "🔍 Debug do JWT:"
echo "   Header: $header"
echo "   Payload: $payload"
echo "   Current time: $now"
echo "   IAT (issued at): $iat"
echo "   EXP (expires): $exp"

# Encode header and payload
header_b64=$(echo -n "$header" | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
payload_b64=$(echo -n "$payload" | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')

echo "   Header B64: $header_b64"
echo "   Payload B64: $payload_b64"

# Create signature
unsigned_token="$header_b64.$payload_b64"
signature=$(echo -n "$unsigned_token" | openssl dgst -sha256 -sign "$GITHUB_PRIVATE_KEY_FILE" -binary | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
jwt_token="$unsigned_token.$signature"

if [ -z "$signature" ]; then
    echo "❌ Falha ao gerar JWT. Verifique se a chave privada está no formato correto"
    exit 1
fi

echo "✅ JWT token gerado com sucesso"

# Testa o JWT obtendo informações do app
echo "🔍 Testando JWT token..."
app_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -H "Authorization: Bearer $jwt_token" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/app)

http_status=$(echo $app_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
app_body=$(echo $app_response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$http_status" != "200" ]; then
    echo "❌ Falha na autenticação JWT (HTTP $http_status)"
    echo "📝 Resposta: $app_body"
    echo ""
    echo "🔧 Possíveis problemas:"
    echo "   1. App ID incorreto"
    echo "   2. Chave privada inválida ou corrompida"
    echo "   3. Formato da chave privada incorreto"
    exit 1
fi

app_name=$(echo "$app_body" | jq -r '.name')
echo "✅ JWT válido! App conectado: $app_name"

# Obtém installation token
echo "🎫 Obtendo installation token..."
token_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $jwt_token" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/app/installations/$GITHUB_INSTALLATION_ID/access_tokens")

http_status=$(echo $token_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
token_body=$(echo $token_response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$http_status" != "201" ]; then
    echo "❌ Falha ao obter installation token (HTTP $http_status)"
    echo "📝 Resposta: $token_body"
    echo ""
    echo "🔧 Possíveis problemas:"
    echo "   1. Installation ID incorreto"
    echo "   2. App não está instalado na organização"
    echo "   3. App não tem as permissões necessárias"
    exit 1
fi

installation_token=$(echo "$token_body" | jq -r '.token')
if [ "$installation_token" = "null" ]; then
    echo "❌ Token de instalação não encontrado na resposta"
    exit 1
fi

echo "✅ Installation token obtido com sucesso!"

# Testa o installation token fazendo uma chamada simples
echo "🧪 Testando installation token..."
user_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -H "Authorization: Bearer $installation_token" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/app/installations)

http_status=$(echo $user_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
user_body=$(echo $user_response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$http_status" != "200" ]; then
    # Se der 403, é normal - significa que o token funciona mas não tem permissão para este endpoint específico
    if [ "$http_status" = "403" ]; then
        echo "⚠️  Token funciona mas sem permissão para este endpoint (esperado)"
        echo "✅ Installation token está funcionando corretamente!"
    else
        echo "❌ Installation token inválido (HTTP $http_status)"
        echo "📝 Resposta: $user_body"
        exit 1
    fi
else
    echo "✅ Installation token válido!"
fi
echo ""
echo "🎉 SUCESSO! Suas credenciais estão corretas:"
echo "   ✓ App ID: $GITHUB_APP_ID"
echo "   ✓ Installation ID: $GITHUB_INSTALLATION_ID"
echo "   ✓ Private Key: Válida"
echo ""
echo "🚀 Agora você pode usar essas credenciais no n8n!"
