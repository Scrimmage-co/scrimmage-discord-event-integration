import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DiscordService } from './services/discord.service';
import { DiscordToScrimmageService } from './services/discord-to-scrimmage.service';
import { ConfigModule } from '@nestjs/config';
import { ScrimmageService } from './services/scrimmage.service';
import { DiscordUtilsService } from './services/discord-utils.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    DiscordService,
    DiscordToScrimmageService,
    ScrimmageService,
    DiscordUtilsService,
  ],
})
export class AppModule {}
