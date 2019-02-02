import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { GoodgameChatModule } from './app/module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(GoodgameChatModule, {
    transport: Transport.TCP,
  });

  await app.listen(() => {
    //
  });
}

bootstrap();
