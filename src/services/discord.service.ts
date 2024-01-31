import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { ConfigService } from '@nestjs/config';
import { ScrimmageService } from './scrimmage.service';
import { DiscordToScrimmageService } from './discord-to-scrimmage.service';

@Injectable()
export class DiscordService implements OnModuleInit {
  private readonly logger = new Logger(DiscordService.name);
  private allowedGuildIds: string[];
  private allowedChannelIds: string[];
  private client: Client;

  constructor(
    private configService: ConfigService,
    private mappingService: ScrimmageService,
    private discordToScrimmageService: DiscordToScrimmageService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.client = this.createClient();
    this.addListeners(this.client);
    await this.client.login(this.configService.get('DISCORD_TOKEN'));
    this.allowedGuildIds = this.configService
      .get<string>('DISCORD_ALLOWED_GUILD_IDS')
      .split(',')
      .filter(id => Boolean(id));
    this.allowedChannelIds = this.configService
      .get<string>('DISCORD_ALLOWED_CHANNEL_IDS')
      .split(',')
      .filter(id => Boolean(id));
  }

  private addListeners(client: Client) {
    client.on(Events.ClientReady, () => {
      this.logger.log('Discord client ready');
    });
    this.addMessageReactionAddListener(client);
    this.addMessageCreateListener(client);
    this.addGuildMemberAddListener(client);
    this.addGuildMemberUpdateListener(client);
    this.addGuildMemberRemoveListener(client);
    this.addThreadCreateListener(client);
    this.addVoiceStateUpdateListener(client);
    this.addGuildScheduledEventUserAddListener(client);
    this.addGuildScheduledEventUserRemoveListener(client);
  }

  private createClient(): Client {
    return new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
      ],
    });
  }

  private addMessageReactionAddListener(client: Client) {
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
      if (!this.isAllowedGuild(reaction.message.guild.id)) {
        return;
      }
      if (!this.isAllowedChannel(reaction.message.channel.id)) {
        return;
      }
      await this.discordToScrimmageService.trackMessageReactionAdd(
        reaction,
        user,
      );
    });
  }

  private addMessageCreateListener(client: Client) {
    client.on(Events.MessageCreate, async message => {
      if (!this.isAllowedGuild(message.guild.id)) {
        return;
      }
      if (!this.isAllowedChannel(message.channel.id)) {
        return;
      }
      await this.discordToScrimmageService.trackMessageCreate(message);
    });
  }

  private addGuildMemberAddListener(client: Client) {
    client.on(Events.GuildMemberAdd, async member => {
      if (!this.isAllowedGuild(member.guild.id)) {
        return;
      }
      if (!this.isAllowedChannel(member.guild.systemChannelId)) {
        return;
      }
      await this.discordToScrimmageService.trackGuildMemberAdd(member);
    });
  }

  private addGuildMemberUpdateListener(client: Client) {
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
      if (!this.isAllowedGuild(newMember.guild.id)) {
        return;
      }
      if (!this.isAllowedChannel(newMember.guild.systemChannelId)) {
        return;
      }
      await this.discordToScrimmageService.trackGuildMemberUpdate(
        oldMember,
        newMember,
      );
    });
  }

  private addGuildMemberRemoveListener(client: Client) {
    client.on(Events.GuildMemberRemove, async member => {
      if (!this.isAllowedGuild(member.guild.id)) {
        return;
      }
      if (!this.isAllowedChannel(member.guild.systemChannelId)) {
        return;
      }
      await this.discordToScrimmageService.trackGuildMemberRemove(member);
    });
  }

  private addThreadCreateListener(client: Client) {
    client.on(Events.ThreadCreate, async thread => {
      if (!this.isAllowedGuild(thread.guild.id)) {
        return;
      }
      if (!this.isAllowedChannel(thread.guild.systemChannelId)) {
        return;
      }
      await this.discordToScrimmageService.trackThreadCreate(thread);
    });
  }

  private addVoiceStateUpdateListener(client: Client) {
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      if (!this.isAllowedGuild(newState.guild.id)) {
        return;
      }
      if (!this.isAllowedChannel(newState.guild.systemChannelId)) {
        return;
      }
      await this.discordToScrimmageService.trackVoiceStateUpdate(
        oldState,
        newState,
      );
    });
  }

  private addGuildScheduledEventUserAddListener(client: Client) {
    client.on(Events.GuildScheduledEventUserAdd, async (event, user) => {
      if (!this.isAllowedGuild(event.guild.id)) {
        return;
      }
      if (!this.isAllowedChannel(event.guild.systemChannelId)) {
        return;
      }
      await this.discordToScrimmageService.trackGuildScheduledEventUserAdd(
        event,
        user,
      );
    });
  }

  private addGuildScheduledEventUserRemoveListener(client: Client) {
    client.on(Events.GuildScheduledEventUserRemove, async (event, user) => {
      if (!this.isAllowedGuild(event.guild.id)) {
        return;
      }
      if (!this.isAllowedChannel(event.guild.systemChannelId)) {
        return;
      }
      await this.discordToScrimmageService.trackGuildScheduledEventUserRemove(
        event,
        user,
      );
    });
  }

  private isAllowedGuild(guildId: string): boolean {
    return (
      this.allowedGuildIds.length === 0 ||
      this.allowedGuildIds.includes(guildId)
    );
  }

  private isAllowedChannel(channelId: string): boolean {
    return (
      this.allowedChannelIds.length === 0 ||
      this.allowedChannelIds.includes(channelId)
    );
  }
}
