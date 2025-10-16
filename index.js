const fs = require('fs');
const path = require('path');

const botsDir = path.join(__dirname, 'bots');

fs.readdirSync(botsDir).forEach(bot => {
  const botPath = path.join(botsDir, bot);
  const entry = ['index.js', 'bot.js'].find(f => fs.existsSync(path.join(botPath, f)));
  if (entry) {
    console.log(`Iniciando ${bot}...`);
    require(path.join(botPath, entry));
  }
});