import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('PORT', '3000'), 10);
  const hostname = configService.get('HOSTNAME', '0.0.0.0');
  await app.listen(port, hostname);
}
bootstrap();
