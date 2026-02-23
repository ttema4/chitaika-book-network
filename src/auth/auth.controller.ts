import { Controller, Get, Post, Body, Render, Res, Req, Redirect, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { SupertokensExceptionFilter } from './supertokens.filter';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import SuperTokens from 'supertokens-node';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
@UseFilters(SupertokensExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Render('auth/login')
  loginPage() {
    return { title: 'Вход' };
  }

  @Post('login')
  async login(@Body() body: any, @Res() res: Response, @Req() req: Request) {
      const tenantId = body.tenantId || "public";
      const response = await EmailPassword.signIn(tenantId, body.email, body.password);
      
      if (response.status === "WRONG_CREDENTIALS_ERROR") {
          return res.render('auth/login', { error: 'Неверный email или пароль' });
      }

      await Session.createNewSession(req, res, tenantId, new SuperTokens.RecipeUserId(response.user.id), {}, {});

      const email = response.user.emails[0];
      await this.authService.syncUser(response.user.id, email);

      return res.redirect('/');
  }

  @Get('register')
  @Render('auth/register')
  registerPage() {
    return { title: 'Регистрация' };
  }

  @Post('register')
  async register(@Body() body: any, @Res() res: Response, @Req() req: Request) {
      try {
        const tenantId = body.tenantId || "public";
        const response = await EmailPassword.signUp(tenantId, body.email, body.password);

        if (response.status === "EMAIL_ALREADY_EXISTS_ERROR") {
             return res.render('auth/register', { error: 'Такой email уже зарегистрирован' });
        }

        await Session.createNewSession(req, res, tenantId, new SuperTokens.RecipeUserId(response.user.id), {}, {});
        
        const email = response.user.emails[0];
        await this.authService.syncUser(response.user.id, email, body.username);

        return res.redirect('/');
      } catch (e) {
          console.error('Registration error:', e);
          return res.render('auth/register', { error: 'Ошибка регистрации. Проверьте консоль сервера.' });
      }
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
      const session = await Session.getSession(req, res, { sessionRequired: false });
      if (session) {
          await session.revokeSession();
      }
      return res.redirect('/');
  }
}
