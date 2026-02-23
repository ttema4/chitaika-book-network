import { Controller, Post, Body, Res, Req, UseFilters, HttpCode, HttpStatus, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { SupertokensExceptionFilter } from './supertokens.filter';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import SuperTokens from 'supertokens-node';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('api/auth')
@UseFilters(SupertokensExceptionFilter)
export class AuthApiController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
      const tenantId = "public";
      const response = await EmailPassword.signIn(tenantId, body.email, body.password);
      
      if (response.status === "WRONG_CREDENTIALS_ERROR") {
          throw new UnauthorizedException('Invalid credentials');
      }

      await Session.createNewSession(req, res, tenantId, new SuperTokens.RecipeUserId(response.user.id), {}, {});

      const email = response.user.emails[0];
      await this.authService.syncUser(response.user.id, email);

      return { message: 'Login successful', userId: response.user.id };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
        const tenantId = "public";
        const response = await EmailPassword.signUp(tenantId, body.email, body.password);

        if (response.status === "EMAIL_ALREADY_EXISTS_ERROR") {
             throw new ConflictException('Email already exists');
        }

        await Session.createNewSession(req, res, tenantId, new SuperTokens.RecipeUserId(response.user.id), {}, {});
        
        const email = response.user.emails[0];
        await this.authService.syncUser(response.user.id, email, body.username);

        return { message: 'Registration successful', userId: response.user.id };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
      const session = await Session.getSession(req, res, { sessionRequired: false });
      if (session) {
          await session.revokeSession();
      }
      return { message: 'Logout successful' };
  }
}
