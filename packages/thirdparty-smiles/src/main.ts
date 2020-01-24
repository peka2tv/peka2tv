import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ThirdpartySmilesModule } from './app/module';
import { CONFIG } from './config/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(ThirdpartySmilesModule, new FastifyAdapter());

  app.enableCors({ origin: '*' });

  await app.listen(CONFIG.port);
}

bootstrap();
