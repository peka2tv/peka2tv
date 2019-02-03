import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { GoodgameChatModule } from './app/module';
import { CONFIG } from './config/config';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(GoodgameChatModule, {
    transport: Transport.TCP,
    options: {
      port: CONFIG.port,
    }
  });

  await app.listen(() => {
    //
  });
}

bootstrap();
