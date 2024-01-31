import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Scrimmage from '@scrimmage/rewards';

interface ScrimmageEvent {
  userId: string;
  uniqueId?: string;
  dataType: string;
  body: Record<string, any>;
}

interface RegisterUserParam {
  avatar: string;
  userId: string;
  username: string;
}

@Injectable()
export class ScrimmageService implements OnModuleInit {
  private logger = new Logger(ScrimmageService.name);
  private eventsQueue: Promise<void>[] = [];
  private widgetLink: string;
  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await Scrimmage.initRewarder({
      apiServerEndpoint: this.configService.get(
        'SCRIMMAGE_API_SERVER_ENDPOINT',
      ),
      privateKey: this.configService.get('SCRIMMAGE_PRIVATE_KEY'),
      namespace: this.configService.get('SCRIMMAGE_NAMESPACE'),
      logger: {
        debug: (message: string) => this.logger.debug(message),
        log: (message: string) => this.logger.log(message),
        info: (message: string) => this.logger.log(message),
        error: (message: string) => this.logger.error(message),
        warn: (message: string) => this.logger.warn(message),
      },
    });
    this.widgetLink = this.configService.get('SCRIMMAGE_API_SERVER_ENDPOINT');
    if (!this.widgetLink.endsWith('/')) {
      this.widgetLink += '/';
    }
  }

  trackEvent(event: ScrimmageEvent) {
    this.logger.log(
      `Tracking event: ${event.dataType} for user ${event.userId}`,
    );
    if (event.uniqueId) {
      this.watchEvent(
        Scrimmage.reward.trackRewardableOnce(
          event.userId,
          event.dataType,
          event.uniqueId,
          event.body,
        ),
      );
    } else {
      this.watchEvent(
        Scrimmage.reward.trackRewardable(
          event.userId,
          event.dataType,
          event.body,
        ),
      );
    }
  }

  /**
   * This method is used to avoid unhandled promise rejections.
   */
  private watchEvent(promisedEvent: Promise<any>) {
    promisedEvent.catch(error => {
      this.logger.error(error);
      this.eventsQueue = this.eventsQueue.filter(
        event => event !== promisedEvent,
      );
    });
    this.eventsQueue.push(promisedEvent);
  }

  async registerUser(param: RegisterUserParam): Promise<string> {
    this.logger.log(`Registering user ${param.userId}`);
    const token = await Scrimmage.user.getUserToken(param.userId, {
      properties: {
        ...(param.username && { username: param.username }),
        ...(param.avatar && { avatar: param.avatar }),
      },
    });
    return `You have been registered for rewards. [Click to see more](${this.widgetLink}?token=${token})`;
  }
}
