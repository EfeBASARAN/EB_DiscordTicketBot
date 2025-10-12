const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const ticketCreatedLog = require('../embeds/logs/ticket-created.json');
const ticketClosedLog = require('../embeds/logs/ticket-closed.json');
const ticketHandledLog = require('../embeds/logs/ticket-handled.json');

class TicketLogger {
    constructor(client) {
        this.client = client;
    }

    async logTicketCreated(ticketChannel, user) {
        try {
            const logChannel = this.client.channels.cache.get(config.ticketLogChannelId);
            if (!logChannel) {
                console.error('❌ Ticket log kanalı bulunamadı!');
                return;
            }

            const guild = ticketChannel.guild;
            const serverIcon = guild.iconURL({ dynamic: true, size: 64 });
            const userAvatar = user.displayAvatarURL({ dynamic: true, size: 64 });

            const embed = new EmbedBuilder()
                .setTitle(ticketCreatedLog.title)
                .setDescription(ticketCreatedLog.description)
                .addFields(
                    {
                        name: ticketCreatedLog.fields[0].name,
                        value: ticketCreatedLog.fields[0].value
                            .replace('{user}', user)
                            .replace('{userTag}', user.tag)
                            .replace('{userId}', user.id),
                        inline: ticketCreatedLog.fields[0].inline
                    },
                    {
                        name: ticketCreatedLog.fields[1].name,
                        value: ticketCreatedLog.fields[1].value
                            .replace('{channel}', ticketChannel)
                            .replace('{channelId}', ticketChannel.id),
                        inline: ticketCreatedLog.fields[1].inline
                    },
                    {
                        name: ticketCreatedLog.fields[2].name,
                        value: ticketCreatedLog.fields[2].value
                            .replace('{timestamp}', `<t:${Math.floor(Date.now() / 1000)}:F>`),
                        inline: ticketCreatedLog.fields[2].inline
                    }
                )
                .setColor(ticketCreatedLog.color)
                .setThumbnail(userAvatar)
                .setFooter({ 
                    text: `${guild.name} Ticket Sistemi`,
                    iconURL: serverIcon
                })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
            console.log(`📝 Ticket oluşturma logu gönderildi: ${user.tag}`);

        } catch (error) {
            console.error('❌ Ticket log hatası:', error);
        }
    }

    async logTicketClosed(ticketChannel, user, closedBy) {
        try {
            const logChannel = this.client.channels.cache.get(config.ticketLogChannelId);
            if (!logChannel) {
                console.error('❌ Ticket log kanalı bulunamadı!');
                return;
            }

            const guild = ticketChannel.guild;
            const serverIcon = guild.iconURL({ dynamic: true, size: 64 });
            const userAvatar = user.displayAvatarURL({ dynamic: true, size: 64 });

            const embed = new EmbedBuilder()
                .setTitle(ticketClosedLog.title)
                .setDescription(ticketClosedLog.description)
                .addFields(
                    {
                        name: ticketClosedLog.fields[0].name,
                        value: ticketClosedLog.fields[0].value
                            .replace('{user}', user)
                            .replace('{userTag}', user.tag)
                            .replace('{userId}', user.id),
                        inline: ticketClosedLog.fields[0].inline
                    },
                    {
                        name: ticketClosedLog.fields[1].name,
                        value: ticketClosedLog.fields[1].value
                            .replace('{channel}', ticketChannel)
                            .replace('{channelId}', ticketChannel.id),
                        inline: ticketClosedLog.fields[1].inline
                    },
                    {
                        name: ticketClosedLog.fields[2].name,
                        value: ticketClosedLog.fields[2].value
                            .replace('{closedBy}', closedBy)
                            .replace('{closedByTag}', closedBy.tag)
                            .replace('{closedById}', closedBy.id),
                        inline: ticketClosedLog.fields[2].inline
                    },
                    {
                        name: ticketClosedLog.fields[3].name,
                        value: ticketClosedLog.fields[3].value
                            .replace('{timestamp}', `<t:${Math.floor(Date.now() / 1000)}:F>`),
                        inline: ticketClosedLog.fields[3].inline
                    }
                )
                .setColor(ticketClosedLog.color)
                .setThumbnail(userAvatar)
                .setFooter({ 
                    text: `${guild.name} Ticket Sistemi`,
                    iconURL: serverIcon
                })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
            console.log(`📝 Ticket kapatma logu gönderildi: ${user.tag} - ${closedBy.tag}`);

        } catch (error) {
            console.error('❌ Ticket log hatası:', error);
        }
    }

    async logTicketHandled(ticketChannel, userId, handledBy) {
        try {
            const logChannel = this.client.channels.cache.get(config.ticketHandleChannelId);
            if (!logChannel) {
                console.error(`❌ Ticket handle log kanalı bulunamadı! ID: ${config.ticketHandleChannelId}`);
                return;
            }

            const guild = ticketChannel.guild;
            const serverIcon = guild.iconURL({ dynamic: true, size: 64 });
            const user = await this.client.users.fetch(userId);
            const userAvatar = user.displayAvatarURL({ dynamic: true, size: 64 });

            const embed = new EmbedBuilder()
                .setTitle(ticketHandledLog.title)
                .addFields(
                    {
                        name: ticketHandledLog.fields[0].name,
                        value: ticketHandledLog.fields[0].value
                            .replace('{handledBy}', handledBy)
                            .replace('{handledByTag}', handledBy.tag)
                            .replace('{handledById}', handledBy.id),
                        inline: ticketHandledLog.fields[0].inline
                    },
                    {
                        name: ticketHandledLog.fields[1].name,
                        value: ticketHandledLog.fields[1].value
                            .replace('{user}', user)
                            .replace('{userTag}', user.tag)
                            .replace('{userId}', user.id),
                        inline: ticketHandledLog.fields[1].inline
                    }
                )
                .setColor(ticketHandledLog.color)
                .setThumbnail(handledBy.displayAvatarURL({ dynamic: true, size: 64 }))
                .setFooter({ 
                    text: `${guild.name} Ticket Sistemi`,
                    iconURL: serverIcon
                })
                .setTimestamp();

            await logChannel.send({ 
                content: `**${handledBy} Destek talebiyle ilgilendi! 🎯**`, 
                embeds: [embed] 
            });
            console.log(`📝 Ticket ilgilenme logu gönderildi: ${user.tag} - ${handledBy.tag}`);

        } catch (error) {
            console.error('❌ Ticket handle log hatası:', error);
        }
    }
}

module.exports = TicketLogger;
