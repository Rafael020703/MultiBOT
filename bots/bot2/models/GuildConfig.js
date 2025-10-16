const mongoose = require('mongoose');


const guildConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    welcomeChannelId: { type: String, default: null },
    leaveChannelId: { type: String, default: null },
    welcomeMessage: { type: String, default: 'Bem-vindo ao servidor, {user}!' },
    welcomeEmbed: { type: String, default: '' },
    leaveMessage: { type: String, default: '{user} saiu do servidor.' },
    leaveEmbed: { type: String, default: '' },
    logChannelId: { type: String, default: null },
    logOptions: {
        joinVoice: { type: Boolean, default: true },
        leaveVoice: { type: Boolean, default: true },
        messageDelete: { type: Boolean, default: true },
        messageEdit: { type: Boolean, default: true },
        memberBan: { type: Boolean, default: true },
        memberKick: { type: Boolean, default: true },
        memberJoin: { type: Boolean, default: false },
        memberLeave: { type: Boolean, default: false }
    },
    xpSystem: {
        enabled: { type: Boolean, default: true },
        maxLevel: { type: Number, default: 50 },
        levels: [{
            level: Number,
            xp: Number,
            reward: { type: String, default: '' }
        }]
    }
});

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
