import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import hbs from 'hbs';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import supertokens from 'supertokens-node';
import { AppModule } from './app.module';
import { SupertokensExceptionFilter } from './auth/supertokens.filter';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TimingInterceptor } from './common/interceptors/timing.interceptor';
import { CacheControlInterceptor } from './common/interceptors/cache-control.interceptor';
import { EtagInterceptor } from './common/interceptors/etag.interceptor';

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

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter(), new SupertokensExceptionFilter());
  
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
      new TimingInterceptor(),
      new CacheControlInterceptor(reflector),
      new EtagInterceptor()
  );

  const config = new DocumentBuilder()
    .setTitle('Book Network API')
    .setDescription('The Book Network API description')
    .setVersion('1.0')
    .addTag('books')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useStaticAssets(join(process.cwd(), 'public'));
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('hbs');
  
  hbs.registerPartials(join(process.cwd(), 'views', 'partials'));
  app.use(methodOverride('_method'));

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs at: http://localhost:${port}/api/docs`);
  console.log(`GraphQL playground at: http://localhost:${port}/graphql`);
}
bootstrap();
