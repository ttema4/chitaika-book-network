import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import hbs from 'hbs';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import supertokens from 'supertokens-node';
import { AppModule } from './app.module';
import { SupertokensExceptionFilter } from './auth/supertokens.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;
  
  app.use(cookieParser());

  app.enableCors({
      origin: [configService.get('SUPERTOKENS_WEBSITE_DOMAIN') || `http://localhost:${port}`],
      allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
      credentials: true,
  });

  app.useGlobalFilters(new SupertokensExceptionFilter());

  app.useStaticAssets(join(process.cwd(), 'public'));
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('hbs');
  
  hbs.registerPartials(join(process.cwd(), 'views', 'partials'));
  app.use(methodOverride('_method'));

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
