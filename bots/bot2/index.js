require('dotenv').config();
const fs = require('fs');
const { Client, Collection, GatewayIntentBits, Events, REST, Routes, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const GuildConfig = require('./models/GuildConfig');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});
client.commands = new Collection();

const commandsPath = __dirname + '/commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];
for (const file of commandFiles) {
    const command = require(`${commandsPath}/${file}`);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
async function deployCommands() {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('Comandos atualizados com sucesso!');
    } catch (error) {
        console.error('Erro ao fazer deploy dos comandos:', error);
    }
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Conectado ao MongoDB!');
        deployCommands();
        client.login(process.env.DISCORD_TOKEN);
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });

async function sendLog(guildId, { color, description }) {
    const config = await GuildConfig.findOne({ guildId });
    if (!config || !config.logChannelId) return;
    const channel = await client.channels.fetch(config.logChannelId).catch(() => null);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(description)
        .setTimestamp();
    channel.send({ embeds: [embed] }).catch(() => { });
}

client.once(Events.ClientReady, c => {
    console.log(`Bot logado como ${c.user.tag}`);
});

client.on(Events.GuildCreate, async (guild) => {
    let config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) {
        config = new GuildConfig({ guildId: guild.id });
        await config.save();
        console.log(`Configuração criada para o servidor ${guild.id}`);
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    await sendLog(member.guild.id, {
        color: 0x43b581,
        description: `🟢 <@${member.user.id}> entrou no servidor.`
    });
});

client.on(Events.GuildMemberRemove, async (member) => {
    await sendLog(member.guild.id, {
        color: 0x99aab5,
        description: `🔴 <@${member.user.id}> saiu do servidor.`
    });
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (!oldState.channelId && newState.channelId) {
        await sendLog(newState.guild.id, {
            color: 0x7289da,
            description: `🎤 <@${newState.id}> entrou em <#${newState.channelId}>`
        });
    }
    if (oldState.channelId && !newState.channelId) {
        await sendLog(newState.guild.id, {
            color: 0x7289da,
            description: `🎤 <@${newState.id}> saiu de <#${oldState.channelId}>`
        });
    }
});

client.on(Events.MessageDelete, async msg => {
    if (!msg.guild) return;
    await sendLog(msg.guild.id, {
        color: 0xff5555,
        description: `🗑️ Mensagem apagada em <#${msg.channel.id}> por <@${msg.author?.id || 'desconhecido'}>\n\n${msg.content || 'Mensagem sem conteúdo.'}`
    });
});

client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if (!oldMsg.guild) return;
    if (oldMsg.content === newMsg.content) return;
    await sendLog(oldMsg.guild.id, {
        color: 0xffc107,
        description: `✏️ Mensagem editada em <#${oldMsg.channel.id}> por <@${oldMsg.author?.id || 'desconhecido'}>\n\n**Antes:** ${oldMsg.content}\n**Depois:** ${newMsg.content}`
    });
});

client.on(Events.GuildBanAdd, async (ban) => {
    await sendLog(ban.guild.id, {
        color: 0x000000,
        description: `⛔ <@${ban.user.id}> foi banido do servidor.`
    });
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Erro ao executar o comando!', ephemeral: true });
        }
    } else if (interaction.isStringSelectMenu() && interaction.customId === 'config_menu') {
        if (interaction.user.id !== '653379118964015105') return;
        const field = interaction.values[0];
        await interaction.reply({ content: `Digite o novo valor para **${field}**:`, ephemeral: true });
        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });
        collector.on('collect', async m => {
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || new GuildConfig({ guildId: interaction.guild.id });
            config[field] = m.content;
            await config.save();
            await interaction.followUp({ content: `Configuração **${field}** atualizada!`, ephemeral: true });
        });
    }
});
