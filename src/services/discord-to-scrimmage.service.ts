import { Injectable } from '@nestjs/common';
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

@Injectable()
export class DiscordToScrimmageService {
  constructor(
    private scrimmageService: ScrimmageService,
    private discordUtilsService: DiscordUtilsService,
  ) {}

  async trackMessageReactionAdd(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ) {
    console.log(reaction, user);
  }

  async trackMessageCreate(message: Message) {
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(message.author),
      uniqueId: message.id,
      dataType: 'discordMessageSent',
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
        guildId: message.guild.id,
        message: message.content,
        timestamp: message.createdTimestamp,
        date: await this.discordUtilsService.createEventDateFromTimestamp(
          message.createdTimestamp,
        ),
        content: message.content,
        embedsAmount: message.embeds.length,
        embedsTypes: message.embeds.map(embed => embed.data.type),
        embedsProviderNames: message.embeds.map(embed => embed.provider.name),
        stickersAmount: [...message.stickers.entries()].length,
        attachmentsAmount: message.attachments.size,
        componentsAmount: message.components.length,
        original: message.toJSON(),
      },
    });
  }

  async trackGuildMemberAdd(member: GuildMember) {
    console.log(member);
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(member.user),
      uniqueId: member.user.id,
      dataType: 'discordGuildMemberAdd',
      body: {
        guildId: member.guild.id,
        joinedTimestamp: member.joinedTimestamp,
        joinedDate: await this.discordUtilsService.createEventDateFromTimestamp(
          member.joinedTimestamp,
        ),
        guildMemberCount: member.guild.memberCount,
        nickname: member.nickname,
        roles: member.roles.cache.map(role => role.id),
        original: member.toJSON(),
      },
    });
  }

  async trackGuildMemberUpdate(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember,
  ) {
    console.log(oldMember, newMember);
  }

  async trackGuildMemberRemove(member: GuildMember | PartialGuildMember) {
    console.log(member);
  }

  async trackThreadCreate(thread: PublicThreadChannel | PrivateThreadChannel) {
    console.log(thread);
  }

  async trackVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    console.log(oldState, newState);
    this.scrimmageService.trackEvent({
      userId: await this.discordUtilsService.getUserId(newState.member.user),
      uniqueId: newState.member.user.id,
      dataType: 'discordVoiceStateUpdate',
      body: {
        guildId: newState.guild.id,
        channelId: newState.channelId,
        oldChannelId: oldState.channelId,
        timestamp: newState.member.joinedTimestamp,
        date: await this.discordUtilsService.createEventDateFromTimestamp(
          newState.member.joinedTimestamp,
        ),
        amountOfUsersInChannel: newState.channel.members.size,
        original: newState.toJSON(),
      },
    });
  }

  async trackGuildScheduledEventCreate(event: GuildScheduledEvent) {
    console.log(event);
  }

  async trackGuildScheduledEventUserAdd(
    event: GuildScheduledEvent | PartialGuildScheduledEvent,
    user: User,
  ) {
    console.log(event, user);
  }

  async trackGuildScheduledEventUserRemove(
    event: GuildScheduledEvent | PartialGuildScheduledEvent,
    user: User,
  ) {
    console.log(event, user);
  }
}
