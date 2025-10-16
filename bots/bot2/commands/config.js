const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configurações do bot (apenas para o dono)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (interaction.user.id !== '653379118964015105') {
            return interaction.reply({ content: 'Apenas o dono pode usar este comando.', ephemeral: true });
        }

        const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || new GuildConfig({ guildId: interaction.guild.id });

        const embed = new EmbedBuilder()
            .setTitle('Configuração do Bot')
            .setDescription('Selecione abaixo o que deseja configurar.\n\n⚙️ **Opções disponíveis:**')
            .addFields(
                { name: 'Canal de log', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Não definido', inline: true }
            )
            .setColor(0x5865F2)
            .setFooter({ text: 'Somente o dono pode alterar as configurações.' });

        const menu = new StringSelectMenuBuilder()
            .setCustomId('config_menu')
            .setPlaceholder('Selecione uma opção para configurar')
            .addOptions([
                { label: 'Canal de log', value: 'logChannelId', emoji: '📋' }
            ]);

        await interaction.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
    }
};