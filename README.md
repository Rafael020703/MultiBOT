# Multi Discord Bots

Este projeto é uma estrutura para hospedar vários bots do Discord usando JavaScript. Cada bot possui sua própria lógica e comandos, permitindo fácil gerenciamento e escalabilidade.

## Estrutura do Projeto

```
multi-discord-bots
├── bots
│   ├── bot1
│   │   ├── bot.js          # Ponto de entrada do bot 1
│   │   ├── commands
│   │   │   └── index.js    # Comandos do bot 1
│   │   └── utils
│   │       └── config.js    # Configurações do bot 1
│   ├── bot2
│   │   ├── bot.js          # Ponto de entrada do bot 2
│   │   ├── commands
│   │   │   └── index.js    # Comandos do bot 2
│   │   └── utils
│   │       └── config.js    # Configurações do bot 2
│   └── ...
├── shared
│   ├── logger.js           # Funções de log compartilhadas
│   └── helpers.js          # Funções utilitárias compartilhadas
├── package.json            # Configuração do npm
└── README.md               # Documentação do projeto
```

## Como Configurar

1. Clone o repositório:
   ```
   git clone <url-do-repositorio>
   cd multi-discord-bots
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure os tokens de autenticação e outras variáveis de ambiente nos arquivos `config.js` de cada bot.

## Como Executar os Bots

Para iniciar um bot, navegue até o diretório do bot desejado e execute o arquivo `bot.js`:

```
node bots/bot1/bot.js
```

ou

```
node bots/bot2/bot.js
```

## Contribuição

Sinta-se à vontade para contribuir com melhorias ou novos bots. Crie um fork do repositório e envie um pull request com suas alterações.

## Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para mais detalhes.