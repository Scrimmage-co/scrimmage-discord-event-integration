import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  GuildMember,
  GuildScheduledEvent,
  Message,
  MessageReaction,
  PartialGuildMember,
  PartialGuildScheduledEvent,
  PartialMessageReaction,
  PartialUser,
  PrivateThreadChannel,
  PublicThreadChannel,
  User,
  VoiceState,
} from 'discord.js';
import { ScrimmageService } from './scrimmage.service';
import { DiscordUtilsService } from './discord-utils.service';
import { MessageType } from 'discord-api-types/v10';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordToScrimmageService implements OnModuleInit {
  private dataTypePrefix;

  constructor(
    private scrimmageService: ScrimmageService,
    private discordUtilsService: DiscordUtilsService,
    private configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dataTypePrefix = this.configService.get('SCRIMMAGE_DATA_TYPE_PREFIX');
  }

  async trackMessageReactionAdd(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ) {
    // User reacted to a message
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(user),
      uniqueId: `${reaction.message.id}::${reaction.emoji.id}`,
      dataType: `${this.dataTypePrefix}DiscordMessageReactionAdd`,
      body: {
        channelName: (reaction.message.channel as any).name,
        channelId: reaction.message.channel.id,
        guildName: reaction.message.guild.name,
        guildId: reaction.message.guild.id,
        messageId: reaction.message.id,
        messageContent: reaction.message.content,
        reaction: reaction.emoji.name,
        reactionId: reaction.emoji.id,
        reactionCount: reaction.count,
        totalReactionsCount: reaction.message.reactions.cache.size,
        original: reaction.toJSON(),
      },
    });
    // Message of the user received a reaction
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(reaction.message.author),
      uniqueId: `${reaction.message.id}::${reaction.emoji.id}`,
      dataType: `${this.dataTypePrefix}DiscordMessageReactionReceived`,
      body: {
        channelName: (reaction.message.channel as any).name,
        channelId: reaction.message.channel.id,
        guildName: reaction.message.guild.name,
        guildId: reaction.message.guild.id,
        messageId: reaction.message.id,
        messageContent: reaction.message.content,
        reaction: reaction.emoji.name,
        reactionId: reaction.emoji.id,
        reactionCount: reaction.count,
        totalReactionsCount: reaction.message.reactions.cache.size,
        original: reaction.toJSON(),
      },
    });
  }

  async registerUser(user: User) {
    return this.scrimmageService.registerUser({
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
    });
  }

  async trackMessageCreate(message: Message) {
    // User sent a message
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(message.author),
      uniqueId: message.id,
      dataType: `${this.dataTypePrefix}DiscordMessageSent`,
      body: {
        isBot: message.author.bot,
        isWebhook: message.webhookId !== null,
        isSystem: message.system,
        isPartial: message.partial,
        type: message.type,
        typeName: Object.keys(MessageType).find(
          key => MessageType[key] === message.type,
        ),
        channelId: message.channel.id,
        channelName: (message.channel as any).name,
        guildId: message.guild.id,
        guildName: message.guild.name,
        content: message.content,
        timestamp: message.createdTimestamp,
        date: this.discordUtilsService.createEventDateFromTimestamp(
          message.createdTimestamp,
        ),
        embedsAmount: message.embeds.length,
        embedsTypes: message.embeds.map(embed => embed.data.type),
        stickersAmount: [...message.stickers.entries()].length,
        attachmentsAmount: message.attachments.size,
        componentsAmount: message.components.length,
        original: message.toJSON(),
      },
    });
  }

  async trackGuildMemberAdd(member: GuildMember) {
    // User joined to the server
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(member.user),
      uniqueId: member.user.id,
      dataType: `${this.dataTypePrefix}DiscordGuildMemberAdd`,
      body: {
        guildName: member.guild.name,
        guildId: member.guild.id,
        joinedTimestamp: member.joinedTimestamp,
        joinedDate: await this.discordUtilsService.createEventDateFromTimestamp(
          member.joinedTimestamp,
        ),
        guildMemberCount: member.guild.memberCount,
        nickname: member.nickname,
        roleNames: member.roles.cache.map(role => role.name),
        roles: member.roles.cache.map(role => role.id),
        original: member.toJSON(),
      },
    });
  }

  async trackGuildMemberUpdate(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember,
  ) {
    // Role added
    if (oldMember.roles.cache.size < newMember.roles.cache.size) {
      const addedRole = newMember.roles.cache.find(
        role => !oldMember.roles.cache.has(role.id),
      );
      this.scrimmageService.trackEvent({
        userId: await this.discordUtilsService.getUserId(newMember.user),
        uniqueId: newMember.user.id,
        dataType: `${this.dataTypePrefix}DiscordGuildMemberRoleAdd`,
        body: {
          guildName: newMember.guild.name,
          guildId: newMember.guild.id,
          role: addedRole.name,
          roleId: addedRole.id,
          original: newMember.toJSON(),
        },
      });
    }
    // Role removed
    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
      const removedRole = oldMember.roles.cache.find(
        role => !newMember.roles.cache.has(role.id),
      );
      this.scrimmageService.trackEvent({
        userId: await this.discordUtilsService.getUserId(newMember.user),
        uniqueId: newMember.user.id,
        dataType: `${this.dataTypePrefix}DiscordGuildMemberRoleRemove`,
        body: {
          guildName: newMember.guild.name,
          guildId: newMember.guild.id,
          role: removedRole.name,
          roleId: removedRole.id,
          original: newMember.toJSON(),
        },
      });
    }
    // Start boosting
    if (!oldMember.premiumSince && newMember.premiumSince) {
      this.scrimmageService.trackEvent({
        userId: await this.discordUtilsService.getUserId(newMember.user),
        uniqueId: newMember.user.id,
        dataType: `${this.dataTypePrefix}DiscordGuildMemberBoostStart`,
        body: {
          guildName: newMember.guild.name,
          guildId: newMember.guild.id,
          original: newMember.toJSON(),
        },
      });
    }
    // Stop boosting
    if (oldMember.premiumSince && !newMember.premiumSince) {
      this.scrimmageService.trackEvent({
        userId: await this.discordUtilsService.getUserId(newMember.user),
        uniqueId: newMember.user.id,
        dataType: `${this.dataTypePrefix}DiscordGuildMemberBoostStop`,
        body: {
          guildName: newMember.guild.name,
          guildId: newMember.guild.id,
          original: newMember.toJSON(),
        },
      });
    }
  }

  async trackGuildMemberRemove(member: GuildMember | PartialGuildMember) {
    // User left the server
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(member.user),
      uniqueId: member.user.id,
      dataType: `${this.dataTypePrefix}DiscordGuildMemberRemove`,
      body: {
        guildName: member.guild.name,
        guildId: member.guild.id,
        original: member.toJSON(),
      },
    });
  }

  async trackThreadCreate(thread: PublicThreadChannel | PrivateThreadChannel) {
    // User created a thread
    const owner = await thread.fetchOwner();
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(owner.user),
      uniqueId: thread.id,
      dataType: `${this.dataTypePrefix}DiscordThreadCreate`,
      body: {
        guildName: thread.guild.name,
        guildId: thread.guild.id,
        channelName: (thread as any).name,
        channelId: thread.id,
        original: thread.toJSON(),
      },
    });
  }

  async trackVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    if (
      (oldState.channelId !== null && newState.channelId === null) ||
      (oldState.channelId !== null &&
        newState.channelId !== null &&
        oldState.channelId !== newState.channelId)
    ) {
      this.scrimmageService.trackEvent({
        userId: await this.discordUtilsService.getUserId(newState.member.user),
        uniqueId: newState.member.user.id,
        dataType: `${this.dataTypePrefix}DiscordVoiceChannelLeave`,
        body: {
          guildName: newState.guild.name,
          guildId: newState.guild.id,
          channelId: oldState.channelId,
          channelName: oldState.channel.name,
          original: newState.toJSON(),
        },
      });
    }
    if (
      (oldState.channelId === null && newState.channelId !== null) ||
      (oldState.channelId !== null &&
        newState.channelId !== null &&
        oldState.channelId !== newState.channelId)
    ) {
      this.scrimmageService.trackEvent({
        userId: await this.discordUtilsService.getUserId(newState.member.user),
        uniqueId: newState.member.user.id,
        dataType: `${this.dataTypePrefix}DiscordVoiceChannelJoin`,
        body: {
          guildName: newState.guild.name,
          guildId: newState.guild.id,
          channelId: newState.channel.id,
          channelName: (newState.channel as any).name,
          original: newState.toJSON(),
        },
      });
    }
  }

  async trackGuildScheduledEventUserAdd(
    event: GuildScheduledEvent | PartialGuildScheduledEvent,
    user: User,
  ) {
    // User joined to the event
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(user),
      uniqueId: user.id,
      dataType: `${this.dataTypePrefix}DiscordGuildScheduledEventUserAdd`,
      body: {
        guildName: event.guild.name,
        guildId: event.guild.id,
        eventName: event.name,
        eventId: event.id,
        original: event.toJSON(),
      },
    });
  }

  async trackGuildScheduledEventUserRemove(
    event: GuildScheduledEvent | PartialGuildScheduledEvent,
    user: User,
  ) {
    // User left the event
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(user),
      uniqueId: user.id,
      dataType: `${this.dataTypePrefix}DiscordGuildScheduledEventUserRemove`,
      body: {
        guildName: event.guild.name,
        guildId: event.guild.id,
        eventName: event.name,
        eventId: event.id,
        original: event.toJSON(),
      },
    });
  }
}
