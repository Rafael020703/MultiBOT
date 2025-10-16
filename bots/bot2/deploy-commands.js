require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const commandsPath = __dirname + '/commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`${commandsPath}/${file}`);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Iniciando deploy de ${commands.length} comandos (atualizando lista)...`);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('Comandos atualizados com sucesso!');
    } catch (error) {
        console.error(error);
    }
})();
