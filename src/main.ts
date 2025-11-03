import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3000;
  app.enableCors({
    credetials: true,
  });
  app.use(cookieParser());
  await app.listen(PORT, '0.0.0.0');
}
bootstrap();
