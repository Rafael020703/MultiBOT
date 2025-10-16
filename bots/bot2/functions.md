
# Funções e Comandos do BOT-ADM

## Comandos Slash
- `/ping`: Responde com "Pong!" de forma ephemeral (apenas o usuário vê).

## Funcionalidades do Bot
- Mensagem de boas-vindas automática (configurável pela dashboard).
- Mensagem de saída automática (configurável pela dashboard).
- Deploy automático dos comandos ao iniciar.
- Salva configurações de cada servidor no MongoDB (canais de boas-vindas e saída).
- Criação automática de configuração ao entrar em novo servidor.

## Dashboard Web
- Login via Discord OAuth2.
- Lista todos os servidores onde você é ADM.
- Permite configurar canais de boas-vindas e saída para cada servidor.
- (A implementar) Visual moderno, avatar do usuário, listagem de cargos, canais, membros, contagem de membros, seleção dinâmica de canais/cargos.

## Arquivos Importantes

- `.env`: Variáveis sensíveis (tokens, URIs, client secrets).
- `.gitignore`: Ignora arquivos sensíveis e dependências.
- `src/index.js`: Arquivo principal do bot.
- `src/commands/ping.js`: Comando de ping.
- `src/models/GuildConfig.js`: Modelo de configuração de servidor.
- `src/deploy-commands.js`: Deploy manual dos comandos (não é mais necessário, mas pode ser útil).
- `web/server.js`: Servidor Express da dashboard.
- `web/views/dashboard.ejs`: Dashboard principal (EJS).
- `web/views/guild.ejs`: Página de configuração de servidor (EJS).
- `start.js`: Inicia bot e dashboard juntos.
- `package.json`: Scripts e dependências do projeto.

## Como rodar

1. Instale as dependências: `npm install`
2. Configure o `.env` com seus dados do Discord e MongoDB.
3. Inicie tudo junto: `npm start` ou `node .`
