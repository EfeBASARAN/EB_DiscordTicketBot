const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const responses = require('./responses/responses.json');

// Import classes
const CommandHandler = require('./src/CommandHandler');
const TicketManager = require('./src/TicketManager');
const PanelManager = require('./src/PanelManager');
const ManagementManager = require('./src/ManagementManager');
const TicketLogger = require('./src/TicketLogger');

class TicketBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });

        this.ticketManager = new TicketManager(this.client);
        this.panelManager = new PanelManager(this.client);
        this.managementManager = new ManagementManager(this.client, this.ticketManager);
        this.ticketLogger = new TicketLogger(this.client);
        this.commandHandler = new CommandHandler(this.client, this.ticketManager);
        
        // Set references in ticket manager
        this.ticketManager.managementManager = this.managementManager;
        this.ticketManager.ticketLogger = this.ticketLogger;
        
        // Set ticket manager reference in ticket logger
        this.ticketLogger.ticketManager = this.ticketManager;

        this.setupEvents();
    }

    setupEvents() {
        this.client.once('ready', () => {
            console.log(responses.botStarted.replace('{tag}', this.client.user.tag));
            console.log(responses.guildsActive.replace('{count}', this.client.guilds.cache.size));
            
            // Setup panel on startup
            this.panelManager.setupTicketPanel();
            
            // Send management embed
            this.managementManager.sendManagementEmbed();
            
            // Start auto-update for management embed
            this.managementManager.startAutoUpdate();
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isButton()) {
                switch (interaction.customId) {
                    case 'create_ticket':
                        await this.ticketManager.createTicket(interaction);
                        break;
                    case 'handle_ticket':
                        await this.ticketManager.handleTicket(interaction);
                        break;
                    case 'close_ticket':
                        await this.ticketManager.closeTicket(interaction);
                        break;
                    case 'query_staff':
                        await this.managementManager.handleStaffQuery(interaction);
                        break;
                }
            } else if (interaction.isModalSubmit()) {
                switch (interaction.customId) {
                    case 'staff_query_modal':
                        await this.managementManager.handleStaffQuerySubmit(interaction);
                        break;
                }
            }
        });

        this.client.on('messageCreate', async (message) => {
            await this.commandHandler.handleMessage(message);
        });

        // Error handling
        this.client.on('error', console.error);
        process.on('unhandledRejection', console.error);
    }

    start() {
        this.client.login(config.token);
    }
}

// Start the bot
const bot = new TicketBot();
bot.start();
