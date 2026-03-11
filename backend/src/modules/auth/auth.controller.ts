import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest')
  async guestLogin(@Body('username') username?: string) {
    return this.authService.guestLogin(username);
  }
}
