const { EmbedBuilder } = require('discord.js');
const responses = require('../responses/responses.json');
const logger = require('./utils/logger');

class CommandHandler {
    constructor(client, ticketManager) {
        this.client = client;
        this.ticketManager = ticketManager;
        this.prefix = require('../config.json').prefix;
    }

    async handleMessage(message) {
        if (message.author.bot) return;
        if (!message.content.startsWith(this.prefix)) return;

        const args = message.content.slice(this.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        switch (command) {
            case 'ticket':
                await this.handleTicketCommand(message, args);
                break;
            default:
                break;
        }
    }

    async handleTicketCommand(message, args) {
        const subCommand = args[0];

        switch (subCommand) {
            case 'panel':
                await this.handlePanelCommand(message);
                break;
            default:
                break;
        }
    }

    async handlePanelCommand(message) {
        try {
            const PanelManager = require('./PanelManager');
            const panelManager = new PanelManager(this.client);
            await panelManager.setupTicketPanel();
            await message.reply(responses.panelUpdated);
        } catch (error) {
            logger.error(`Panel komut hatası: ${error}`);
            await message.reply(responses.panelUpdateError);
        }
    }

}

module.exports = CommandHandler;
