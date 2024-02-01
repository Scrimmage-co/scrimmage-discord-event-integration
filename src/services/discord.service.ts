import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  Client,
  Events,
  GatewayIntentBits,
  GuildMember,
  Message,
  MessageReaction,
  PartialGuildMember,
  PartialMessage,
  PartialMessageReaction,
  Partials,
  PartialUser,
  User,
} from 'discord.js';
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
      partials: [Partials.Reaction, Partials.Message, Partials.Channel],
    });
  }

  private addMessageReactionAddListener(client: Client) {
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
      const fullReaction = await this.loadPartialEntitySafe(reaction);
      const fullUser = await this.loadPartialEntitySafe(user);
      await this.ifValidExecute(
        reaction.message.guild.id,
        reaction.message.channel.id,
        [fullReaction, fullUser],
        async () => {
          await this.discordToScrimmageService.trackMessageReactionAdd(
            fullReaction,
            fullUser,
          );
        },
      );
    });
  }

  private addMessageCreateListener(client: Client) {
    client.on(Events.MessageCreate, async message => {
      const fullMessage = await this.loadPartialEntitySafe(message);
      await this.ifValidExecute(
        message.guild.id,
        message.channel.id,
        [fullMessage],
        async () => {
          await this.discordToScrimmageService.trackMessageCreate(fullMessage);
        },
      );
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
      const fullMember = await this.loadPartialEntitySafe(member);
      await this.ifValidExecute(
        member.guild.id,
        member.guild.systemChannelId,
        [fullMember],
        async () => {
          await this.discordToScrimmageService.trackGuildMemberAdd(fullMember);
        },
      );
    });
  }

  private addGuildMemberUpdateListener(client: Client) {
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
      const fullOldMember = await this.loadPartialEntitySafe(oldMember);
      const fullNewMember = await this.loadPartialEntitySafe(newMember);
      await this.ifValidExecute(
        newMember.guild.id,
        newMember.guild.systemChannelId,
        [fullOldMember, fullNewMember],
        async () => {
          await this.discordToScrimmageService.trackGuildMemberUpdate(
            fullOldMember,
            fullNewMember,
          );
        },
      );
    });
  }

  private addGuildMemberRemoveListener(client: Client) {
    client.on(Events.GuildMemberRemove, async member => {
      const fullMember = await this.loadPartialEntitySafe(member);
      await this.ifValidExecute(
        member.guild.id,
        member.guild.systemChannelId,
        [fullMember],
        async () => {
          await this.discordToScrimmageService.trackGuildMemberRemove(
            fullMember,
          );
        },
      );
    });
  }

  private addThreadCreateListener(client: Client) {
    client.on(Events.ThreadCreate, async thread => {
      await this.ifValidExecute(
        thread.guild.id,
        thread.guild.systemChannelId,
        [thread],
        async () => {
          await this.discordToScrimmageService.trackThreadCreate(thread);
        },
      );
    });
  }

  private addVoiceStateUpdateListener(client: Client) {
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      await this.ifValidExecute(
        newState.guild.id,
        newState.guild.systemChannelId,
        [oldState, newState],
        async () => {
          await this.discordToScrimmageService.trackVoiceStateUpdate(
            oldState,
            newState,
          );
        },
      );
    });
  }

  private addGuildScheduledEventUserAddListener(client: Client) {
    client.on(Events.GuildScheduledEventUserAdd, async (event, user) => {
      await this.ifValidExecute(
        event.guild.id,
        event.guild.systemChannelId,
        [event, user],
        async () => {
          await this.discordToScrimmageService.trackGuildScheduledEventUserAdd(
            event,
            user,
          );
        },
      );
    });
  }

  private addGuildScheduledEventUserRemoveListener(client: Client) {
    client.on(Events.GuildScheduledEventUserRemove, async (event, user) => {
      await this.ifValidExecute(
        event.guild.id,
        event.guild.systemChannelId,
        [event, user],
        async () => {
          await this.discordToScrimmageService.trackGuildScheduledEventUserRemove(
            event,
            user,
          );
        },
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

  private ifValidExecute(
    guildId: string,
    channelId: string,
    requiredNonNullObjects: any[],
    callback: () => Promise<void>,
  ): Promise<void> {
    if (
      this.isAllowedGuild(guildId) &&
      this.isAllowedChannel(channelId) &&
      requiredNonNullObjects.every(Boolean)
    ) {
      return callback();
    }
  }

  private async loadPartialEntitySafe<
    Entity extends
      | MessageReaction
      | PartialMessageReaction
      | Message
      | PartialMessage
      | User
      | PartialUser
      | GuildMember
      | PartialGuildMember,
    Result extends ReturnType<Entity['fetch']>,
  >(entity: Entity): Promise<Result> {
    if (entity.partial) {
      try {
        const fullEntity = await entity.fetch();
        return fullEntity as Result;
      } catch (error) {
        this.logger.error(error);
        return null;
      }
    } else {
      return entity as any as Result;
    }
  }
}
