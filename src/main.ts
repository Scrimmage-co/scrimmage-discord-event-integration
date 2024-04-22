import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Configuration } from './configurations';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Configuration>);
  const requiredEnvs = [
    'DISCORD_TOKEN',
    'SCRIMMAGE_API_SERVER_ENDPOINT',
    'SCRIMMAGE_PRIVATE_KEY',
    'SCRIMMAGE_NAMESPACE',
    'WEBHOOK_DOMAIN',
    'WEBHOOK_PORT',
  ];
  for (const env of requiredEnvs) {
    if (!configService.get(env as any)) {
      console.error(`Missing required environment variable: ${env}`);
      process.exit(1);
    }
  }
  await app.listen(configService.get('PORT'), configService.get('HOSTNAME'));
  app.enableShutdownHooks();
}
bootstrap();
