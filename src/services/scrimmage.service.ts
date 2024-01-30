import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import Scrimmage from '@scrimmage/rewards';

interface ScrimmageEvent {
  userId: string;
  uniqueId?: string;
  dataType: string;
  body: Record<string, any>;
}

@Injectable()
export class ScrimmageService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    // await Scrimmage.initRewarder({
    //   apiServerEndpoint: this.configService.get(
    //     'SCRIMMAGE_API_SERVER_ENDPOINT',
    //   ),
    //   privateKey: this.configService.get('SCRIMMAGE_PRIVATE_KEY'),
    //   namespace: this.configService.get('SCRIMMAGE_NAMESPACE'),
    // });
  }

  trackEvent(event: ScrimmageEvent) {
    // TODO
  }
}
