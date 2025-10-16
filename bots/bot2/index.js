

// ====== Carregamento de dependências e variáveis ======
require('dotenv').config();
const fs = require('fs');
const { Client, Collection, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const mongoose = require('mongoose');
const GuildConfig = require('./models/GuildConfig');
const MemberXP = require('./models/MemberXP');
// XP/rank: mensagem = ganha XP, sobe de nível, aplica recompensa
const XP_COOLDOWN = 60; // segundos
const XP_MIN = 10, XP_MAX = 20;
const ms = require('ms');

// ====== Inicialização do Client Discord ======
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.commands = new Collection();

// Handler de XP/rank (deve ser depois do client)
client.on(Events.MessageCreate, async (msg) => {
    if (!msg.guild || msg.author.bot) return;
    const config = await GuildConfig.findOne({ guildId: msg.guild.id });
    if (!config || !config.xpSystem || !config.xpSystem.enabled) return;
    // Cooldown por usuário
    let memberXP = await MemberXP.findOne({ guildId: msg.guild.id, userId: msg.author.id });
    const now = new Date();
    if (memberXP && memberXP.lastMessage && (now - memberXP.lastMessage) / 1000 < XP_COOLDOWN) return;
    // XP aleatório
    const xpGain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
    if (!memberXP) {
        memberXP = new MemberXP({ guildId: msg.guild.id, userId: msg.author.id, xp: 0, level: 1 });
    }
    memberXP.xp += xpGain;
    memberXP.lastMessage = now;
    // Verifica se subiu de nível
    let nextLevel = memberXP.level + 1;
    let levelConfig = (config.xpSystem.levels || []).find(lv => lv.level === nextLevel);
    let leveledUp = false;
    while (levelConfig && memberXP.xp >= levelConfig.xp) {
        memberXP.level = nextLevel;
        leveledUp = true;
        // Recompensa: cargo ou texto
        if (levelConfig.reward) {
            const role = msg.guild.roles.cache.get(levelConfig.reward);
            if (role) {
                try { await msg.member.roles.add(role); } catch {}
            } else {
                try { await msg.channel.send(`<@${msg.author.id}> ganhou: ${levelConfig.reward}`); } catch {}
            }
        }
        nextLevel++;
        levelConfig = (config.xpSystem.levels || []).find(lv => lv.level === nextLevel);
    }
    await memberXP.save();
    // Mensagem de level up
    if (leveledUp) {
        try {
            await msg.channel.send({ content: `🎉 <@${msg.author.id}> subiu para o nível ${memberXP.level}!` });
        } catch {}
    }
});

// ====== Carregamento dos comandos ======
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

// ====== Função de deploy automático dos comandos ======
const rest = new REST().setToken(process.env.DISCORD_TOKEN);
async function deployCommands() {
    try {
        console.log(`Iniciando deploy de ${commands.length} comandos (atualizando lista)...`);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('Comandos atualizados com sucesso!');
    } catch (error) {
        console.error('Erro ao fazer deploy dos comandos:', error);
    }
}

// ====== Conexão com MongoDB e inicialização do bot ======
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Conectado ao MongoDB!');
        deployCommands();
        client.login(process.env.DISCORD_TOKEN);
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });

// ====== Eventos do Discord ======

// Pronto
client.once(Events.ClientReady, c => {
    console.log(`Bot logado como ${c.user.tag}`);
});

// Novo servidor: cria config
client.on(Events.GuildCreate, async (guild) => {
    try {
        let config = await GuildConfig.findOne({ guildId: guild.id });
        if (!config) {
            config = new GuildConfig({ guildId: guild.id });
            await config.save();
            console.log(`Configuração criada para o servidor ${guild.id}`);
        }
    } catch (err) {
        console.error('Erro ao criar configuração do servidor:', err);
    }
});


// Boas-vindas personalizada (mensagem e embed)
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        const config = await GuildConfig.findOne({ guildId: member.guild.id });
        if (config && config.welcomeChannelId) {
            const channel = member.guild.channels.cache.get(config.welcomeChannelId);
            if (channel) {
                let msg = config.welcomeMessage || 'Bem-vindo ao servidor, {user}!';
                msg = parsePlaceholders(msg, member, channel, member.guild);
                let embed = null;
                if (config.welcomeEmbed) {
                    try {
                        embed = JSON.parse(parsePlaceholders(config.welcomeEmbed, member, channel, member.guild));
                    } catch (e) { embed = null; }
                }
                if (msg && embed) channel.send({ content: msg, embeds: [embed] });
                else if (embed) channel.send({ embeds: [embed] });
                else channel.send(msg);
            }
        }
    } catch (err) {
        console.error('Erro ao enviar mensagem de boas-vindas:', err);
    }
});

// Saída personalizada (mensagem e embed)
client.on(Events.GuildMemberRemove, async (member) => {
    try {
        const config = await GuildConfig.findOne({ guildId: member.guild.id });
        if (config && config.leaveChannelId) {
            const channel = member.guild.channels.cache.get(config.leaveChannelId);
            if (channel) {
                let msg = config.leaveMessage || '{username} saiu do servidor.';
                msg = parsePlaceholders(msg, member, channel, member.guild);
                let embed = null;
                if (config.leaveEmbed) {
                    try {
                        embed = JSON.parse(parsePlaceholders(config.leaveEmbed, member, channel, member.guild));
                    } catch (e) { embed = null; }
                }
                if (msg && embed) channel.send({ content: msg, embeds: [embed] });
                else if (embed) channel.send({ embeds: [embed] });
                else channel.send(msg);
            }
        }
    } catch (err) {
        console.error('Erro ao enviar mensagem de saída:', err);
    }
});
// Função para substituir aliases nas mensagens
function parsePlaceholders(str, member, channel, guild) {
    if (!str) return str;
    return str
        .replace(/{user}/g, `<@${member.user.id}>`)
        .replace(/{username}/g, member.user.username)
        .replace(/{userid}/g, member.user.id)
        .replace(/{channel}/g, `<#${channel.id}>`)
        .replace(/{channelname}/g, channel.name)
        .replace(/{guild}/g, guild.name)
        .replace(/{role:([0-9]+)}/g, (_, id) => `<@&${id}>`);
}

// Comandos de interação
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Erro ao executar o comando!', ephemeral: true });
    }
});
// Função para enviar log
async function sendLog(guildId, embed) {
    const config = await GuildConfig.findOne({ guildId });
    if (!config || !config.logChannelId) return;
    const channel = client.channels.cache.get(config.logChannelId);
    if (channel) channel.send({ embeds: [embed] });
}

// Eventos de auditoria
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const config = await GuildConfig.findOne({ guildId: newState.guild.id });
    if (!config || !config.logOptions) return;
    // Entrou em call
    if (config.logOptions.joinVoice && !oldState.channelId && newState.channelId) {
        await sendLog(newState.guild.id, {
            color: 0x7289da,
            description: `<@${newState.id}> entrou em <#${newState.channelId}>`
        });
    }
    // Saiu da call
    if (config.logOptions.leaveVoice && oldState.channelId && !newState.channelId) {
        await sendLog(newState.guild.id, {
            color: 0x7289da,
            description: `<@${newState.id}> saiu de <#${oldState.channelId}>`
        });
    }
});

client.on(Events.MessageDelete, async msg => {
    if (!msg.guild) return;
    const config = await GuildConfig.findOne({ guildId: msg.guild.id });
    if (!config || !config.logOptions || !config.logOptions.messageDelete) return;
    await sendLog(msg.guild.id, {
        color: 0xff5555,
        description: `Mensagem apagada em <#${msg.channel.id}> por <@${msg.author?.id || 'desconhecido'}>\n\n${msg.content}`
    });
});

client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if (!oldMsg.guild) return;
    const config = await GuildConfig.findOne({ guildId: oldMsg.guild.id });
    if (!config || !config.logOptions || !config.logOptions.messageEdit) return;
    if (oldMsg.content === newMsg.content) return;
    await sendLog(oldMsg.guild.id, {
        color: 0xffc107,
        description: `Mensagem editada em <#${oldMsg.channel.id}> por <@${oldMsg.author?.id || 'desconhecido'}>\n\nAntes: ${oldMsg.content}\nDepois: ${newMsg.content}`
    });
});

client.on(Events.GuildBanAdd, async (ban) => {
    const config = await GuildConfig.findOne({ guildId: ban.guild.id });
    if (!config || !config.logOptions || !config.logOptions.memberBan) return;
    await sendLog(ban.guild.id, {
        color: 0x000000,
        description: `<@${ban.user.id}> foi banido do servidor.`
    });
});

client.on(Events.GuildMemberRemove, async (member) => {
    // ...existing code...
    // Log de saída
    const config = await GuildConfig.findOne({ guildId: member.guild.id });
    if (config && config.logOptions && config.logOptions.memberLeave) {
        await sendLog(member.guild.id, {
            color: 0x99aab5,
            description: `<@${member.user.id}> saiu do servidor.`
        });
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    // ...existing code...
    // Log de entrada
    const config = await GuildConfig.findOne({ guildId: member.guild.id });
    if (config && config.logOptions && config.logOptions.memberJoin) {
        await sendLog(member.guild.id, {
            color: 0x43b581,
            description: `<@${member.user.id}> entrou no servidor.`
        });
    }
});
