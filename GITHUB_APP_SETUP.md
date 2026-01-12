# GitHub Organization Helper - GitHub ### 4. Obter as Credenciais

Após a instalação, você precisará de:

1. **App ID**: Encontrado na página principal do app (Settings > Developer settings > GitHub Apps > Seu App)

2. **Installation ID**: Há duas formas de obter:

   **Método A - Pela URL (mais fácil):**
   - Na sua organização, vá em "Settings" > "GitHub Apps" (ou "Installed GitHub Apps")
   - Clique no app instalado
   - Olhe na URL da página: `https://github.com/settings/installations/INSTALLATION_ID`
   - O número no final é o Installation ID

   **Método B - Via script (automático):**
   - Use o script `get-installation-id.sh` incluído neste projeto
   - Edite o arquivo e preencha: APP_ID, caminho da private key, e nome da organização
   - Execute: `./get-installation-id.sh`

3. **Private Key**:
   - Na página do app (Settings > Developer settings > GitHub Apps > Seu App)
   - Vá na seção "Private keys"
   - Clique em "Generate a private key"
   - Faça download do arquivo .pemte node do n8n agora suporta autenticação via GitHub App, que é necessária para criar projetos para times em organizações.

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

## ⚠️ Troubleshooting Comum

### ❌ "authorization failed - please check your credentials"

**Possíveis causas e soluções:**

1. **App ID incorreto**
   - ✅ Verifique na página do GitHub App: Settings > Developer settings > GitHub Apps > [Seu App]
   - ✅ Use apenas números (ex: `2838507`)

2. **Installation ID incorreto**
   - ✅ Método mais confiável: Vá em Settings > GitHub Apps na sua **organização**
   - ✅ Clique no app e veja na URL: `/settings/installations/[INSTALLATION_ID]`
   - ✅ Use apenas números (ex: `50350438`)

3. **Private Key com problema**
   - ✅ Deve incluir as linhas `-----BEGIN RSA PRIVATE KEY-----` e `-----END RSA PRIVATE KEY-----`
   - ✅ Copie todo o conteúdo do arquivo .pem
   - ✅ Não modifique nem remova quebras de linha
   - ✅ Exemplo correto:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA...
   (várias linhas)
   ...xyz123
   -----END RSA PRIVATE KEY-----
   ```

4. **App não instalado corretamente**
   - ✅ Verifique se o app está instalado na **organização correta**
   - ✅ Confirme as permissões: Projects (Write), Teams (Write), Members (Write)

### 🧪 **Teste suas credenciais primeiro:**

Execute o script de teste antes de usar no n8n:

```bash
# 1. Edite o arquivo com suas credenciais:
nano test-github-app-auth.sh

# 2. Execute o teste:
./test-github-app-auth.sh
```

Se o teste passar, suas credenciais estão corretas para usar no n8n!

## Exemplo de uso

Agora você pode criar workflows que automaticamente:
1. Criam um time para um novo projeto
2. Criam um projeto GitHub para esse time
3. Adicionam membros ao time
4. Tudo de forma automatizada via API!
