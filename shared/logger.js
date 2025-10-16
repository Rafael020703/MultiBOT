const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'bot.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage, { encoding: 'utf8' });
}

function logError(error) {
    const timestamp = new Date().toISOString();
    const errorMessage = `${timestamp} - ERROR: ${error}\n`;
    fs.appendFileSync(logFilePath, errorMessage, { encoding: 'utf8' });
}

function getLogs() {
    return fs.readFileSync(logFilePath, { encoding: 'utf8' });
}

module.exports = {
    log,
    logError,
    getLogs,
};