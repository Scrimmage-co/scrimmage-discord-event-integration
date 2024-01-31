import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Configuration } from './configurations';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Configuration>);
  await app.listen(configService.get('PORT'), configService.get('HOSTNAME'));
}
bootstrap();
