const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const botsDir = path.join(__dirname, 'bots');
if (!fs.existsSync(botsDir)) {
  console.log('Diretório de bots não encontrado.');
  process.exit(0);
}

fs.readdirSync(botsDir).forEach(bot => {
  const botPath = path.join(botsDir, bot);
  const pkg = path.join(botPath, 'package.json');
  if (fs.existsSync(pkg)) {
    console.log(`Instalando dependências para ${bot}...`);
    execSync('npm install', { cwd: botPath, stdio: 'inherit' });
  }
});