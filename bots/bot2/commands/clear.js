const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Apaga mensagens por quantidade ou tempo')
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantidade de mensagens a apagar (máx 100)'))
        .addStringOption(opt => opt.setName('tempo').setDescription('Tempo: ex. 10m, 2h, 1d'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const quantidade = interaction.options.getInteger('quantidade');
        const tempo = interaction.options.getString('tempo');
        const channel = interaction.channel;

        let messages;
        if (quantidade) {
            messages = await channel.messages.fetch({ limit: Math.min(quantidade, 100) });
        } else if (tempo) {
            const ms = require('ms')(tempo);
            if (!ms) return interaction.reply({ content: 'Tempo inválido!', ephemeral: true });
            const now = Date.now();
            messages = (await channel.messages.fetch({ limit: 100 }))
                .filter(msg => now - msg.createdTimestamp <= ms);
        } else {
            return interaction.reply({ content: 'Informe quantidade ou tempo!', ephemeral: true });
        }

        await channel.bulkDelete(messages, true);
        await interaction.reply({ content: `🧹 ${messages.size} mensagens apagadas!`, ephemeral: true });
    }
};