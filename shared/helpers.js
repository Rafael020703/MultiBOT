const formatMessage = (message) => {
    return message.trim().charAt(0).toUpperCase() + message.slice(1);
};

const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const isValidCommand = (command, validCommands) => {
    return validCommands.includes(command);
};

module.exports = {
    formatMessage,
    delay,
    isValidCommand
};