const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js'); 
const sqlite3 = require('sqlite3').verbose();
const { token } = require('./config.json'); // Importa o token do arquivo config.json

// Função para adicionar um timestamp aos logs
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Criação da instância do cliente Discord com a configuração correta dos intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,                // Permite acessar as guildas
    GatewayIntentBits.GuildMessages,         // Permite acessar as mensagens nas guildas
    GatewayIntentBits.MessageContent,        // Permite acessar o conteúdo das mensagens
  ],
});

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database('./linked_channels.db', (err) => {
  if (err) {
    logWithTimestamp('Erro ao conectar ao banco de dados: ' + err);
  } else {
    logWithTimestamp('Banco de dados conectado com sucesso!');
    // Criação das tabelas necessárias para armazenar servidores e canais
    db.run(`
      CREATE TABLE IF NOT EXISTS registered_servers (
        server_id TEXT NOT NULL,
        server_name TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        PRIMARY KEY (server_id, channel_id)
      );
    `);
    logWithTimestamp('Tabelas de servidores e canais verificadas ou criadas.');
  }
});

// Comandos do bot
client.on('ready', () => {
  logWithTimestamp(`Bot logado como ${client.user.tag}`);
  client.application?.commands.set([
    new SlashCommandBuilder()
      .setName('registerserver')
      .setDescription('Registra o servidor e o canal para que as mensagens possam ser replicadas'),
    new SlashCommandBuilder()
      .setName('unregisterserver')
      .setDescription('Desvincula o servidor e o canal para parar a replicação de mensagens')
  ]);
  logWithTimestamp('Comandos do bot registrados.');
});

// Lida com a criação de interações de comando
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Comando para registrar o servidor e o canal
  if (commandName === 'registerserver') {
    // Verifica se a interação é de um servidor
    if (!interaction.guild) {
      return interaction.reply('Este comando só pode ser executado em servidores!');
    }

    const server = interaction.guild;  // Obtém o servidor
    const serverId = server.id;        // Obtém o ID do servidor
    const channelId = interaction.channel.id;  // Obtém o ID do canal de onde o comando foi chamado

    try {
      logWithTimestamp(`Comando /registerserver recebido no servidor ${server.name}, canal ${interaction.channel.name}`);
      // Registra o servidor e o canal no banco de dados
      db.run(
        'INSERT OR IGNORE INTO registered_servers (server_id, server_name, channel_id) VALUES (?, ?, ?)',
        [serverId, server.name, channelId],
        function (err) {
          if (err) {
            logWithTimestamp('Erro ao registrar servidor: ' + err);
            return interaction.reply('Houve um erro ao registrar o servidor e o canal.');
          }
          interaction.reply(`Servidor ${server.name} registrado com sucesso. Canal ${interaction.channel.name} registrado para replicação.`);
          logWithTimestamp(`Servidor ${server.name} registrado com sucesso no banco de dados.`);
        }
      );
    } catch (err) {
      logWithTimestamp('Erro ao registrar servidor: ' + err);
      interaction.reply('Houve um erro ao registrar o servidor e o canal.');
    }
  }

  // Comando para desvincular o servidor e o canal
  if (commandName === 'unregisterserver') {
    // Verifica se a interação é de um servidor
    if (!interaction.guild) {
      return interaction.reply('Este comando só pode ser executado em servidores!');
    }

    const serverId = interaction.guild.id;  // Obtém o ID do servidor
    const channelId = interaction.channel.id;

    try {
      logWithTimestamp(`Comando /unregisterserver recebido no servidor ${interaction.guild.name}, canal ${interaction.channel.name}`);
      // Remove o servidor e o canal do banco de dados
      db.run(
        'DELETE FROM registered_servers WHERE server_id = ? AND channel_id = ?',
        [serverId, channelId],
        function (err) {
          if (err) {
            logWithTimestamp('Erro ao desvincular servidor: ' + err);
            return interaction.reply('Houve um erro ao desvincular o servidor e o canal.');
          }
          if (this.changes > 0) {
            interaction.reply(`Servidor e canal desvinculados com sucesso!`);
            logWithTimestamp(`Servidor e canal desvinculados no servidor ${interaction.guild.name}, canal ${interaction.channel.name}`);
          } else {
            interaction.reply('Este servidor e canal não estavam registrados.');
            logWithTimestamp(`Servidor e canal não encontrados no banco de dados para desvinculação.`);
          }
        }
      );
    } catch (err) {
      logWithTimestamp('Erro ao desvincular servidor: ' + err);
      interaction.reply('Houve um erro ao desvincular o servidor e o canal.');
    }
  }
});

// Evento de mensagens recebidas
client.on('messageCreate', async (message) => {
  // Ignora mensagens de bots ou se a mensagem não for de um canal registrado
  if (message.author.bot) return;

  // Verifica se o canal de onde a mensagem foi enviada está registrado no banco de dados
  db.get(
    'SELECT * FROM registered_servers WHERE server_id = ? AND channel_id = ?',
    [message.guild.id, message.channel.id], // Verifica se o canal pertence ao servidor
    async (err, row) => {
      if (err) {
        logWithTimestamp('Erro ao verificar canal registrado: ' + err);
        return;
      }

      // Se o canal não estiver registrado, ignore a mensagem
      if (!row) {
        logWithTimestamp(`Mensagem ignorada. O canal ${message.channel.name} no servidor ${message.guild.name} não está registrado.`);
        return;
      }

      // Caso o canal esteja registrado, prossiga com o envio da mensagem para outros canais registrados
      try {
        logWithTimestamp(`Mensagem recebida no servidor ${message.guild.name}, canal ${message.channel.name}: ${message.content}`);

        // Busca canais registrados em outros servidores
        db.all(
          'SELECT * FROM registered_servers WHERE server_id != ? AND channel_id != ?',
          [message.guild.id, message.channel.id], // Exclui o servidor atual e o canal de origem
          async (err, rows) => {
            if (err) {
              logWithTimestamp('Erro ao buscar canais registrados: ' + err);
              return;
            }

            // Se não houver canais registrados em outros servidores, saia da função
            if (rows.length === 0) {
              logWithTimestamp(`Nenhum canal registrado para replicação em outros servidores`);
              return;
            }

            // Envia a mensagem para os canais registrados
            for (const row of rows) {
              try {
                const targetGuild = await client.guilds.fetch(row.server_id);
                const targetChannel = await targetGuild.channels.fetch(row.channel_id);

                // Verifica se o canal de destino existe e é um canal de texto
                if (targetChannel && targetChannel.isTextBased()) {
                  // Verifica se o bot tem permissão para enviar mensagens no canal de destino
                  const permissions = targetChannel.permissionsFor(targetGuild.members.me);
                  if (!permissions.has('SEND_MESSAGES')) {
                    logWithTimestamp(`O bot não tem permissão para enviar mensagens no canal ${targetChannel.name} no servidor ${targetGuild.name}`);
                    return;
                  }

                  // Envia a mensagem de texto, se houver
                  if (message.content.trim()) {
                    await targetChannel.send(`**Mensagem de ${message.author.tag} em ${message.guild.name}:**\n${message.content}`);
                    logWithTimestamp(`Mensagem enviada para o canal ${targetChannel.name} no servidor ${targetGuild.name}`);
                  }

                  // Envia anexos, se houver
                  if (message.attachments.size > 0) {
                    message.attachments.forEach((attachment) => {
                      if (permissions.has('ATTACH_FILES')) {
                        targetChannel.send({ files: [attachment.url] });
                        logWithTimestamp(`Anexo enviado para o canal ${targetChannel.name} no servidor ${targetGuild.name}`);
                      } else {
                        logWithTimestamp(`O bot não tem permissão para enviar anexos no canal ${targetChannel.name} no servidor ${targetGuild.name}`);
                      }
                    });
                  }
                } else {
                  logWithTimestamp(`Canal de destino ${row.channel_id} não encontrado no servidor ${row.server_id}`);
                }
              } catch (error) {
                logWithTimestamp(`Erro ao enviar mensagem para o canal ${row.channel_id}: ` + error);
              }
            }
          }
        );
      } catch (error) {
        logWithTimestamp('Erro ao processar mensagens recebidas: ' + error);
      }
    }
  );
});

// Login do bot
client.login(token).then(() => {
  logWithTimestamp('Bot logado com sucesso!');
}).catch(err => {
  logWithTimestamp('Erro ao tentar logar no bot: ' + err);
});
