import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { ConfigService } from '@nestjs/config';
import { ScrimmageService } from './scrimmage.service';
import { DiscordToScrimmageService } from './discord-to-scrimmage.service';
import { Subject } from 'rxjs';

@Injectable()
export class DiscordService implements OnModuleInit {
  private readonly logger = new Logger(DiscordService.name);
  private readonly scrimmageEvent$ = new Subject<any>();
  private client: Client;

  constructor(
    private configService: ConfigService,
    private mappingService: ScrimmageService,
    private scrimmageService: DiscordToScrimmageService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.client = this.createClient();
    this.addListeners(this.client);
    await this.client.login(this.configService.get('DISCORD_TOKEN'));
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
    this.addGuildScheduledEventCreateListener(client);
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
    client.on(
      Events.MessageReactionAdd,
      async (reaction, user) =>
        await this.scrimmageService.trackMessageReactionAdd(reaction, user),
    );
  }

  private addMessageCreateListener(client: Client) {
    client.on(
      Events.MessageCreate,
      async message => await this.scrimmageService.trackMessageCreate(message),
    );
  }

  private addGuildMemberAddListener(client: Client) {
    client.on(
      Events.GuildMemberAdd,
      async member => await this.scrimmageService.trackGuildMemberAdd(member),
    );
  }

  private addGuildMemberUpdateListener(client: Client) {
    client.on(
      Events.GuildMemberUpdate,
      async (oldMember, newMember) =>
        await this.scrimmageService.trackGuildMemberUpdate(
          oldMember,
          newMember,
        ),
    );
  }

  private addGuildMemberRemoveListener(client: Client) {
    client.on(
      Events.GuildMemberRemove,
      async member =>
        await this.scrimmageService.trackGuildMemberRemove(member),
    );
  }

  private addThreadCreateListener(client: Client) {
    client.on(
      Events.ThreadCreate,
      async thread => await this.scrimmageService.trackThreadCreate(thread),
    );
  }

  private addVoiceStateUpdateListener(client: Client) {
    client.on(
      Events.VoiceStateUpdate,
      async (oldState, newState) =>
        await this.scrimmageService.trackVoiceStateUpdate(oldState, newState),
    );
  }

  private addGuildScheduledEventCreateListener(client: Client) {
    client.on(
      Events.GuildScheduledEventCreate,
      async event =>
        await this.scrimmageService.trackGuildScheduledEventCreate(event),
    );
  }

  private addGuildScheduledEventUserAddListener(client: Client) {
    client.on(
      Events.GuildScheduledEventUserAdd,
      async (event, user) =>
        await this.scrimmageService.trackGuildScheduledEventUserAdd(
          event,
          user,
        ),
    );
  }

  private addGuildScheduledEventUserRemoveListener(client: Client) {
    client.on(
      Events.GuildScheduledEventUserRemove,
      async (event, user) =>
        await this.scrimmageService.trackGuildScheduledEventUserRemove(
          event,
          user,
        ),
    );
  }
}
