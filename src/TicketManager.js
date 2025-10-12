const { ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const ticketWelcomeEmbed = require('../embeds/ticket-welcome.json');
const ticketCloseEmbed = require('../embeds/ticket-close.json');
const ticketHandledEmbed = require('../embeds/ticket-handled.json');
const buttons = require('../buttons/buttons.json');
const responses = require('../responses/responses.json');

class TicketManager {
    constructor(client) {
        this.client = client;
        this.activeTickets = new Map();
    }

    getActiveTicketsCount() {
        return this.activeTickets.size;
    }

    getActiveTickets() {
        return this.activeTickets;
    }

    async createTicket(interaction) {
        try {
            const userId = interaction.user.id;
            const guild = interaction.guild;
            
            // Check if user already has max tickets
            const userTickets = Array.from(this.activeTickets.values()).filter(ticket => ticket.userId === userId);
            if (userTickets.length >= config.ticketSettings.maxTickets) {
                await interaction.reply({
                    content: responses.maxTicketsReached.replace('{max}', config.ticketSettings.maxTickets),
                    ephemeral: true
                });
                return;
            }

            // Check if ticket channel already exists
            const existingTicket = guild.channels.cache.find(channel => 
                channel.name === `┋ticket-${interaction.user.username.toLowerCase()}` ||
                channel.topic === `Ticket for ${interaction.user.id}`
            );

            if (existingTicket) {
                await interaction.reply({
                    content: responses.ticketExists.replace('{channel}', existingTicket),
                    ephemeral: true
                });
                return;
            }

            // Create ticket channel
            const category = guild.channels.cache.get(config.categoryId);
            if (!category) {
                await interaction.reply({
                    content: responses.categoryNotFound,
                    ephemeral: true
                });
                return;
            }

            const ticketChannel = await guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: `Ticket for ${interaction.user.id}`,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            // Store ticket info
            this.activeTickets.set(ticketChannel.id, {
                userId: interaction.user.id,
                channelId: ticketChannel.id,
                createdAt: new Date()
            });

            // Send welcome message
            await this.sendWelcomeMessage(ticketChannel, interaction.user);

            await interaction.reply({
                content: responses.ticketCreated.replace('{channel}', ticketChannel),
                ephemeral: true
            });

            console.log(responses.newTicketCreated
                .replace('{name}', ticketChannel.name)
                .replace('{user}', interaction.user.tag));

            // Update management embed when ticket is created
            if (this.managementManager) {
                this.managementManager.sendManagementEmbed();
            }

            // Log ticket creation
            if (this.ticketLogger) {
                this.ticketLogger.logTicketCreated(ticketChannel, interaction.user);
            }

        } catch (error) {
            console.error('Ticket oluşturma hatası:', error);
            await interaction.reply({
                content: responses.ticketCreationError,
                ephemeral: true
            });
        }
    }

    async handleTicket(interaction) {
        try {
            const channel = interaction.channel;
            const ticket = this.activeTickets.get(channel.id);

            if (!ticket) {
                await interaction.reply({
                    content: responses.notTicketChannel,
                    ephemeral: true
                });
                return;
            }

            // Check if user has support role or higher
            const supportRole = interaction.guild.roles.cache.get(config.supportRoleId);
            if (!supportRole) {
                await interaction.reply({
                    content: responses.supportRoleNotFound,
                    ephemeral: true
                });
                return;
            }

            if (!interaction.member.roles.cache.has(supportRole.id) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    content: responses.noPermission,
                    ephemeral: true
                });
                return;
            }

            // Check if ticket is already handled
            if (ticket.handledBy) {
                await interaction.reply({
                    content: responses.ticketAlreadyHandled,
                    ephemeral: true
                });
                return;
            }

            // Mark ticket as handled
            ticket.handledBy = interaction.user.id;
            this.activeTickets.set(channel.id, ticket);

            // Send handle confirmation
            const { EmbedBuilder } = require('discord.js');
            const guild = channel.guild;
            const serverIcon = guild.iconURL({ dynamic: true, size: 64 });
            const userAvatar = interaction.user.displayAvatarURL({ dynamic: true, size: 64 });

            const handleEmbed = new EmbedBuilder()
                .setTitle(ticketHandledEmbed.title)
                .setDescription(ticketHandledEmbed.description
                    .replace('{staff}', interaction.user)
                    .replace('{timestamp}', `<t:${Math.floor(Date.now() / 1000)}:R>`))
                .addFields(ticketHandledEmbed.fields)
                .setColor(ticketHandledEmbed.color)
                .setThumbnail(userAvatar)
                .setFooter({ 
                    text: `${guild.name} Ticket Sistemi`,
                    iconURL: serverIcon
                })
                .setTimestamp();

            await channel.send({ 
                embeds: [handleEmbed] 
            });

            await interaction.reply({
                content: responses.ticketHandled,
                ephemeral: true
            });

            // Log ticket handling
            if (this.ticketLogger) {
                this.ticketLogger.logTicketHandled(channel, ticket.userId, interaction.user);
            }

        } catch (error) {
            console.error('Ticket ilgilenme hatası:', error);
            await interaction.reply({
                content: responses.handleTicketError,
                ephemeral: true
            });
        }
    }

    async closeTicket(interaction) {
        try {
            const channel = interaction.channel;
            const ticket = this.activeTickets.get(channel.id);

            if (!ticket) {
                await interaction.reply({
                    content: responses.notTicketChannel,
                    ephemeral: true
                });
                return;
            }

            // Check if user is ticket owner or has admin permissions
            if (ticket.userId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    content: responses.noClosePermission,
                    ephemeral: true
                });
                return;
            }

            // Send close confirmation
            await this.sendCloseMessage(channel, interaction.user);

            // Remove from active tickets
            this.activeTickets.delete(channel.id);

            // Update management embed when ticket is closed
            if (this.managementManager) {
                this.managementManager.sendManagementEmbed();
            }

            // Log ticket closure
            if (this.ticketLogger) {
                this.ticketLogger.logTicketClosed(channel, interaction.user, interaction.user);
            }

            // Delete channel after delay
            setTimeout(async () => {
                try {
                    await channel.delete();
                    console.log(responses.ticketClosed.replace('{name}', channel.name));
                } catch (error) {
                    console.error(responses.channelDeleteError, error);
                }
            }, 10000);

        } catch (error) {
            console.error('Ticket kapatma hatası:', error);
            await interaction.reply({
                content: responses.ticketCloseError,
                ephemeral: true
            });
        }
    }

    async sendWelcomeMessage(channel, user) {
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const guild = channel.guild;
        const serverIcon = guild.iconURL({ dynamic: true, size: 64 });
        
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(ticketWelcomeEmbed.title)
            .setDescription(ticketWelcomeEmbed.description.replace('{user}', user))
            .setColor(ticketWelcomeEmbed.color)
            .setFooter({ 
                text: `${guild.name} Ticket Sistemi`,
                iconURL: serverIcon
            })
            .setTimestamp();

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('handle_ticket')
                    .setLabel(buttons.handleTicket)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel(buttons.closeTicket)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        // Get staff role for mention
        const staffRole = guild.roles.cache.get(config.staffRoleId);
        const staffMention = staffRole ? `${staffRole}` : '';

        await channel.send({ 
            content: `${staffMention}`, 
            embeds: [welcomeEmbed], 
            components: [buttonRow] 
        });
    }

    async sendCloseMessage(channel, user) {
        const { EmbedBuilder } = require('discord.js');
        
        const guild = channel.guild;
        const serverIcon = guild.iconURL({ dynamic: true, size: 64 });
        
        const closeEmbed = new EmbedBuilder()
            .setTitle(ticketCloseEmbed.title)
            .setDescription(ticketCloseEmbed.description.replace('{user}', user))
            .setColor(ticketCloseEmbed.color)
            .setFooter({ 
                text: `${guild.name} Ticket Sistemi`,
                iconURL: serverIcon
            })
            .setTimestamp();

        await channel.send({ embeds: [closeEmbed] });
    }
}

module.exports = TicketManager;
