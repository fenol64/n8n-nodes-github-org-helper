# GitHub Organization Helper - GitHub App Setup

Este node do n8n agora suporta autenticação via GitHub App, que é necessária para criar projetos para times em organizações.

## Como configurar o GitHub App

### 1. Criar o GitHub App

1. Acesse as configurações da sua organização no GitHub
2. Vá em "Settings" > "Developer settings" > "GitHub Apps"
3. Clique em "New GitHub App"
4. Preencha as informações básicas:
   - **App name**: Nome do seu app (ex: "n8n-org-helper")
   - **Homepage URL**: Pode ser a URL da sua instância n8n
   - **Webhook URL**: Deixe em branco se não usar webhooks

### 2. Configurar Permissões

Configure as seguintes permissões para o app:

**Repository permissions:**
- Actions: Read (se necessário)
- Contents: Read (se necessário)
- Issues: Write (se criar issues)
- Pull requests: Write (se criar PRs)

**Organization permissions:**
- Administration: Read
- Members: Write
- Projects: Write (OBRIGATÓRIO para criar projetos)
- Teams: Write

### 3. Instalar o App na Organização

1. Após criar o app, vá na aba "Install App"
2. Clique em "Install" para sua organização
3. Selecione os repositórios (pode ser "All repositories" ou específicos)

### 4. Obter as Credenciais

Após a instalação, você precisará de:

1. **App ID**: Encontrado na página principal do app
2. **Installation ID**:
   - Vá em "Settings" > "Installations" na sua organização
   - Clique no app instalado
   - O ID estará na URL (ex: `/settings/installations/INSTALLATION_ID`)
3. **Private Key**:
   - Na página do app, vá em "Private keys"
   - Clique em "Generate a private key"
   - Faça download do arquivo .pem

### 5. Configurar no n8n

1. Nas credenciais do node, selecione "GitHub App" como método de autenticação
2. Preencha:
   - **App ID**: O ID do seu GitHub App
   - **Installation ID**: O ID da instalação na sua organização
   - **Private Key**: O conteúdo completo do arquivo .pem (incluindo `-----BEGIN RSA PRIVATE KEY-----` e `-----END RSA PRIVATE KEY-----`)

## Funcionalidades com GitHub App

Com o GitHub App configurado, você pode:

- ✅ Criar projetos para organizações
- ✅ Criar projetos para times específicos (com melhor suporte)
- ✅ Gerenciar membros de times
- ✅ Criar times

## Diferenças entre Personal Access Token e GitHub App

| Funcionalidade | Personal Access Token | GitHub App |
|----------------|----------------------|------------|
| Criar times | ✅ | ✅ |
| Adicionar membros a times | ✅ | ✅ |
| Criar projetos para organização | ❌ | ✅ |
| Criar projetos para times | ❌ (manual) | ✅ (melhor suporte) |
| Gerenciamento granular de permissões | ❌ | ✅ |

## Troubleshooting

### Erro de permissões
- Verifique se o GitHub App tem as permissões corretas
- Certifique-se de que está instalado na organização correta

### Erro de autenticação
- Verifique se o App ID está correto
- Confirme o Installation ID na URL da instalação
- Certifique-se de copiar toda a private key incluindo as linhas BEGIN/END

### Project creation fails
- Verifique se o app tem permissão "Projects: Write"
- Confirme que a organização permite projetos

## Exemplo de uso

Agora você pode criar workflows que automaticamente:
1. Criam um time para um novo projeto
2. Criam um projeto GitHub para esse time
3. Adicionam membros ao time
4. Tudo de forma automatizada via API!
