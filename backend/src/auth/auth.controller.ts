import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { LoginThrottlerGuard } from './guards/login-throttler.guard.js';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from './cookie.util.js';
import type { AuthenticatedRequest, SafeUser } from './types.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<SafeUser> {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(LoginThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SafeUser> {
    const { user, token } = await this.authService.login(dto);

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions(this.configService));

    return user;
  }


  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() req: AuthenticatedRequest): Promise<SafeUser> {
    return this.authService.getSafeUserById(req.user.sub);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    // Intentionally not behind JwtAuthGuard: a client with an already
    // expired/invalid cookie must still be able to clear it.
    //
    // This only clears the cookie client-side. The assessment does not
    // include a token blocklist, so a JWT already issued remains
    // cryptographically valid — and would still be accepted by the guard —
    // until it naturally expires. See the implementation report's
    // "Known Issues" section.
    res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions(this.configService));
    return { message: 'Logged out' };
  }
}
