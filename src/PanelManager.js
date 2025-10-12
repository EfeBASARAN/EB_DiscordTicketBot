const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const panelEmbed = require('../embeds/panel.json');
const buttons = require('../buttons/buttons.json');
const responses = require('../responses/responses.json');

class PanelManager {
    constructor(client) {
        this.client = client;
    }

    async setupTicketPanel() {
        try {
            const panelChannel = this.client.channels.cache.get(config.panelChannelId);
            if (!panelChannel) {
                console.error(responses.panelError);
                return;
            }

            // Delete all messages in the panel channel
            const channelMessages = await panelChannel.messages.fetch({ limit: 100 });
            const botMessages = channelMessages.filter(msg => msg.author.id === this.client.user.id);
            
            if (botMessages.size > 0) {
                await panelChannel.bulkDelete(botMessages);
                console.log(`🗑️ ${botMessages.size} eski panel mesajı silindi`);
            }

            // Create panel embed
            const guild = panelChannel.guild;
            const serverIcon = guild.iconURL({ dynamic: true, size: 64 });
            
            const embed = new EmbedBuilder()
                .setTitle(panelEmbed.title)
                .setDescription(panelEmbed.description)
                .setColor(panelEmbed.color)
                .setFooter({ 
                    text: `${guild.name} Ticket Sistemi`,
                    iconURL: serverIcon
                })
                .setTimestamp();

            // Create button
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel(buttons.createTicket)
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );

            await panelChannel.send({ embeds: [embed], components: [row] });
            console.log('✅ Yeni panel mesajı gönderildi');
        } catch (error) {
            console.error(responses.panelError, error);
        }
    }
}

module.exports = PanelManager;
