const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Mostra o ping do bot'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Calculando ping...', fetchReply: true });
        const ms = sent.createdTimestamp - interaction.createdTimestamp;
        await interaction.editReply(`🏓 Ping: ${ms}ms`);
    }
};
