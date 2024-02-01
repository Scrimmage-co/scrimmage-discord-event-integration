import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { ConfigService } from '@nestjs/config';
import { DiscordToScrimmageService } from './discord-to-scrimmage.service';
import DiscordCommands from './commands';
import { Configuration } from '../configurations';

@Injectable()
export class DiscordService implements OnModuleInit {
  private readonly logger = new Logger(DiscordService.name);
  private allowedGuildIds: string[];
  private allowedChannelIds: string[];
  private client: Client;

  constructor(
    private configService: ConfigService<Configuration>,
    private discordToScrimmageService: DiscordToScrimmageService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.client = this.createClient();
    const readyPromise = this.addListeners(this.client);
    await this.client.login(this.configService.get('DISCORD_TOKEN'));
    this.allowedGuildIds = this.configService.get('DISCORD_ALLOWED_GUILD_IDS');
    this.allowedChannelIds = this.configService.get(
      'DISCORD_ALLOWED_CHANNEL_IDS',
    );
    await readyPromise;
    await this.updateCommands(this.client);
  }

  private addListeners(client: Client): Promise<void> {
    const readyPromise = new Promise<void>(resolve => {
      client.on(Events.ClientReady, () => {
        this.logger.log('Discord client ready');
        resolve();
      });
    });

    this.addMessageReactionAddListener(client);
    this.addInteractionCreateListener(client);
    this.addMessageCreateListener(client);
    this.addGuildMemberAddListener(client);
    this.addGuildMemberUpdateListener(client);
    this.addGuildMemberRemoveListener(client);
    this.addThreadCreateListener(client);
    this.addVoiceStateUpdateListener(client);
    this.addGuildScheduledEventUserAddListener(client);
    this.addGuildScheduledEventUserRemoveListener(client);
    return readyPromise;
  }

  private async updateCommands(client: Client) {
    const existingCommands = await client.application.commands.fetch();
    const newCommands = DiscordCommands.filter(
      command =>
        !existingCommands.some(
          existingCommand => existingCommand.name === command.name,
        ),
    );
    for (const command of newCommands) {
      this.logger.log(`Creating command ${command.name}`);
      await client.application.commands.create(command);
    }
    const deletedCommands = existingCommands.filter(
      existingCommand =>
        !DiscordCommands.some(command => command.name === existingCommand.name),
    );
    for (const [name, command] of deletedCommands) {
      this.logger.log(`Deleting command ${name}`);
      await command.delete();
    }
    const updatedCommands = existingCommands.filter(existingCommand =>
      DiscordCommands.some(command => command.name === existingCommand.name),
    );
    for (const [name, command] of updatedCommands) {
      const discordCommand = DiscordCommands.find(
        command => command.name === name,
      );
      this.logger.log(`Updating command ${name}`);
      await client.application.commands.edit(command, {
        ...(command.toJSON() as any),
        ...discordCommand,
      });
    }
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
    client.on(Events.Raw, async payload => {
      if (payload.t !== 'MESSAGE_REACTION_ADD') {
        return;
      }
      if (!this.isAllowedGuild(payload.d.guild_id)) {
        return;
      }
      if (!this.isAllowedChannel(payload.d.channel_id)) {
        return;
      }
      const channel: any = await client.channels.cache
        .get(payload.d.channel_id)
        .fetch();
      if (!channel.messages) {
        return;
      }
      if (channel.messages.cache.has(payload.d.message_id)) {
        // Allow only messages that was created before bot was started
        return;
      }
      const message = await channel.messages.fetch(payload.d.message_id);
      const user = await client.users.fetch(payload.d.user_id);
      const messageReaction = message.reactions.cache.get(
        payload.d.emoji.name || payload.d.emoji.id,
      );
      await this.discordToScrimmageService.trackMessageReactionAdd(
        messageReaction,
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

  private addInteractionCreateListener(client: Client) {
    client.on(Events.InteractionCreate, async interaction => {
      if (!interaction.isCommand()) {
        return;
      }
      if (!this.configService.get('DISCORD_ALLOW_REGISTRATION')) {
        await interaction.reply({
          content: 'Registration is disabled',
          ephemeral: true,
        });
        return;
      }
      const response = await this.discordToScrimmageService.registerUser(
        interaction.user,
      );
      await interaction.reply({
        content: response,
        ephemeral: true,
      });
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
