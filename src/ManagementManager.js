const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const managementEmbed = require('../embeds/management.json');
const staffQueryResultEmbed = require('../embeds/staff-query-result.json');
const buttons = require('../buttons/buttons.json');
const responses = require('../responses/responses.json');
const staffQueryModal = require('../modals/staff-query.json');
const logger = require('./utils/logger');

class ManagementManager {
    constructor(client, ticketManager) {
        this.client = client;
        this.ticketManager = ticketManager;
        this.startTime = new Date();
    }

    async sendManagementEmbed() {
        try {
            const managementChannel = this.client.channels.cache.get(config.managementChannelId);
            if (!managementChannel) {
                logger.error('Yönetim kanalı bulunamadı!');
                return;
            }

            // Check if management message already exists
            const channelMessages = await managementChannel.messages.fetch({ limit: 10 });
            const existingMessage = channelMessages.find(msg => 
                msg.author.id === this.client.user.id && 
                msg.embeds.length > 0 && 
                msg.embeds[0].title === managementEmbed.title
            );

            // Get server statistics
            const guild = this.client.guilds.cache.first();
            const activeTickets = this.ticketManager.getActiveTicketsCount();
            const totalUsers = guild.memberCount;
            const uptime = this.getUptime();
            
            // Get top support staff statistics
            const topStaff = await this.getTopSupportStaff();

            // Create management embed
            const serverIcon = guild.iconURL({ dynamic: true, size: 64 });
            
            const embed = new EmbedBuilder()
                .setTitle(managementEmbed.title)
                .setDescription(managementEmbed.description.replace('{guildName}', guild.name))
                .addFields(
                    {
                        name: managementEmbed.fields[0].name,
                        value: managementEmbed.fields[0].value.replace('{activeTickets}', activeTickets),
                        inline: managementEmbed.fields[0].inline
                    },
                    {
                        name: managementEmbed.fields[1].name,
                        value: managementEmbed.fields[1].value.replace('{totalUsers}', totalUsers),
                        inline: managementEmbed.fields[1].inline
                    },
                    {
                        name: managementEmbed.fields[2].name,
                        value: managementEmbed.fields[2].value.replace('{topStaff}', topStaff),
                        inline: managementEmbed.fields[2].inline
                    },
                    {
                        name: managementEmbed.fields[3].name,
                        value: managementEmbed.fields[3].value.replace('{uptime}', uptime),
                        inline: managementEmbed.fields[3].inline
                    }
                )
                .setColor(managementEmbed.color)
                .setThumbnail(serverIcon)
                .setFooter({ 
                    text: `${guild.name} Ticket Sistemi`,
                    iconURL: serverIcon
                })
                .setTimestamp();

            // Create button row
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('query_staff')
                        .setLabel(buttons.queryStaff)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔍')
                );

            if (existingMessage) {
                // Update existing message
                await existingMessage.edit({ embeds: [embed], components: [buttonRow] });
                logger.success('Yönetim embedi güncellendi');
            } else {
                // Send new message
                await managementChannel.send({ embeds: [embed], components: [buttonRow] });
                logger.success('Yeni yönetim embedi gönderildi');
            }

        } catch (error) {
            logger.error(`Yönetim embedi hatası: ${error}`);
        }
    }

    async getTopSupportStaff() {
        try {
            const logChannel = this.client.channels.cache.get(config.ticketHandleChannelId);
            if (!logChannel) return '`Log kanalı bulunamadı`';

            const staffStats = {};
            let lastMessageId = null;
            
            // Fetch messages in batches from log channel
            for (let i = 0; i < 10; i++) { // Max 10 batches (1000 messages)
                const options = { limit: 100 };
                if (lastMessageId) options.before = lastMessageId;
                
                const messages = await logChannel.messages.fetch(options);
                if (messages.size === 0) break;
                
                // Count mentions of each staff member
                messages.forEach(message => {
                    const mentionMatch = message.content.match(/<@(\d{17,20})>/);
                    if (mentionMatch) {
                        const staffId = mentionMatch[1];
                        staffStats[staffId] = (staffStats[staffId] || 0) + 1;
                    }
                });
                
                lastMessageId = messages.last().id;
            }
            
            // Sort by count and get top 5
            const sortedStaff = Object.entries(staffStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
            
            if (sortedStaff.length === 0) {
                return '`Henüz veri yok`';
            }
            
            // Format the result
            const topStaffList = sortedStaff.map(([userId, count], index) => {
                const user = this.client.users.cache.get(userId);
                if (!user) return `Kullanıcı ${userId}: \`${count} adet\``;
                
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
                return `${medal} ${user}: \`${count} adet\``;
            }).join('\n');
            
            return topStaffList;
        } catch (error) {
            logger.error(`Top staff stats hatası: ${error}`);
            return '`Veri alınamadı`';
        }
    }

    getUptime() {
        const now = new Date();
        const diff = now - this.startTime;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `${days}g ${hours}s ${minutes}d`;
        } else if (hours > 0) {
            return `${hours}s ${minutes}d`;
        } else {
            return `${minutes} dakika`;
        }
    }

    async handleStaffQuery(interaction) {
        try {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
            
            // Create modal
            const modal = new ModalBuilder()
                .setCustomId(staffQueryModal.customId)
                .setTitle(staffQueryModal.title);

            // Create text input
            const staffIdInput = new TextInputBuilder()
                .setCustomId(staffQueryModal.inputs[0].customId)
                .setLabel(staffQueryModal.inputs[0].label)
                .setStyle(TextInputStyle[staffQueryModal.inputs[0].style])
                .setPlaceholder(staffQueryModal.inputs[0].placeholder)
                .setRequired(staffQueryModal.inputs[0].required)
                .setMaxLength(staffQueryModal.inputs[0].maxLength);

            // Add components to modal
            const firstActionRow = new ActionRowBuilder().addComponents(staffIdInput);
            modal.addComponents(firstActionRow);

            // Show modal
            await interaction.showModal(modal);

        } catch (error) {
            logger.error(`Modal hatası: ${error}`);
            await interaction.reply({
                content: responses.modalError,
                ephemeral: true
            });
        }
    }

    async handleStaffQuerySubmit(interaction) {
        try {
            const staffId = interaction.fields.getTextInputValue('staff_id_input');
            
            // Validate ID
            if (!/^\d{17,20}$/.test(staffId)) {
                await interaction.reply({
                    content: responses.invalidDiscordId,
                    ephemeral: true
                });
                return;
            }

            // Get staff mention count from log channel
            const mentionCount = await this.getStaffMentionCount(staffId);
            
            // Get user info
            const user = await this.client.users.fetch(staffId).catch(() => null);
            const userName = user ? `${user.tag} (${user.username})` : `Bilinmeyen Kullanıcı (${staffId})`;

            // Create response embed
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setTitle(staffQueryResultEmbed.title)
                .setDescription(staffQueryResultEmbed.description.replace('{userName}', userName))
                .addFields(
                    {
                        name: staffQueryResultEmbed.fields[0].name,
                        value: staffQueryResultEmbed.fields[0].value
                            .replace('{mentionCount}', mentionCount)
                            .replace('{mentionCount}', mentionCount),
                        inline: staffQueryResultEmbed.fields[0].inline
                    }
                )
                .setColor(staffQueryResultEmbed.color)
                .setFooter({ 
                    text: `${interaction.guild.name} Ticket Sistemi`,
                    iconURL: interaction.guild.iconURL({ dynamic: true, size: 64 })
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            logger.error(`Staff query submit hatası: ${error}`);
            await interaction.reply({
                content: responses.queryError,
                ephemeral: true
            });
        }
    }

    async getStaffMentionCount(staffId) {
        try {
            const logChannel = this.client.channels.cache.get(config.ticketHandleChannelId);
            if (!logChannel) return 0;

            // Fetch messages from log channel
            let totalCount = 0;
            let lastMessageId = null;
            
            // Fetch messages in batches
            for (let i = 0; i < 10; i++) { // Max 10 batches (1000 messages)
                const options = { limit: 100 };
                if (lastMessageId) options.before = lastMessageId;
                
                const messages = await logChannel.messages.fetch(options);
                if (messages.size === 0) break;
                
                // Count mentions of this staff member
                messages.forEach(message => {
                    if (message.content.includes(`<@${staffId}>`)) {
                        totalCount++;
                    }
                });
                
                lastMessageId = messages.last().id;
            }
            
            return totalCount;
        } catch (error) {
            logger.error(`Staff mention count hatası: ${error}`);
            return 0;
        }
    }

    // Auto-update management embed every 20 seconds
    startAutoUpdate() {
        setInterval(() => {
            this.sendManagementEmbed();
        }, 20 * 1000); // 20 seconds
    }
}

module.exports = ManagementManager;
