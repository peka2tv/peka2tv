import { NestFactory } from '@nestjs/core';
import { GoodgameChatModule } from './app/module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(GoodgameChatModule);

  await app.listen(() => {
    //
  });
}

bootstrap();
