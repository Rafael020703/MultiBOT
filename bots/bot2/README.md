# BOT-ADM

BOT PARA ADMINISTRAR O SERVIDOR

---

## ✨ Comandos Slash

- **`/ping`**: Responde com "Pong!" de forma ephemeral (apenas o usuário vê).

## ⚙️ Funcionalidades do Bot

- Mensagem de boas-vindas automática (configurável pela dashboard)
- Mensagem de saída automática (configurável pela dashboard)
- Deploy automático dos comandos ao iniciar
- Salva configurações de cada servidor no MongoDB (canais de boas-vindas e saída)
- Criação automática de configuração ao entrar em novo servidor

## 🖥️ Dashboard Web

- Login via Discord OAuth2
- Lista todos os servidores onde você é ADM
- Permite configurar canais de boas-vindas, saída, logs e XP para cada servidor
- Visual moderno, avatar do usuário, listagem de cargos, canais, membros, contagem de membros, seleção dinâmica de canais/cargos

## 📁 Arquivos Importantes

- `.env`: Variáveis sensíveis (tokens, URIs, client secrets)
- `.gitignore`: Ignora arquivos sensíveis e dependências
- `src/index.js`: Arquivo principal do bot
- `src/commands/ping.js`: Comando de ping
- `src/models/GuildConfig.js`: Modelo de configuração de servidor
- `src/models/MemberXP.js`: Modelo de XP/rank de membros
- `src/deploy-commands.js`: Deploy manual dos comandos (não é mais necessário, mas pode ser útil)
- `web/server.js`: Servidor Express da dashboard
- `web/views/dashboard.ejs`: Dashboard principal (EJS)
- `web/views/guild.ejs`: Página de configuração de servidor (EJS)
- `start.js`: Inicia bot e dashboard juntos
- `package.json`: Scripts e dependências do projeto

## 🚀 Como rodar

```bash
npm install
```

Configure o `.env` com seus dados do Discord e MongoDB.

```bash
npm start
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

> Feito com ❤️ para administração de servidores Discord!
