import { Body, Controller, Get, Post, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export class GuestLoginDto {
  @ApiProperty({
    description: 'Optional preferred username for the guest session',
    example: 'Guest_Tester',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('AuthController initialized');
  }

  @ApiOperation({ summary: 'Login as a guest or resume session' })
  @ApiResponse({ status: 201, description: 'Guest session created successfully' })
  @Post('guest')
  async guestLogin(@Body() guestLoginDto: GuestLoginDto) {
    return this.authService.guestLogin(guestLoginDto.username);
  }

  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @ApiOperation({ summary: 'Google One-Click verification' })
  @ApiResponse({ status: 200, description: 'User verified and logged in' })
  @Post('google/verify')
  async verifyGoogle(@Body('credential') credential: string) {
    return this.authService.verifyGoogleIdToken(credential);
  }

  @ApiOperation({ summary: 'Google OAuth2 callback' })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const accessToken = await this.authService.generateToken(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    // Redirect back to frontend with the token
    return res.redirect(`${frontendUrl}/auth-callback?token=${accessToken}`);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current player profile' })
  @ApiResponse({ status: 200, description: 'Player profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    return this.authService.getPlayerById(req.user.userId);
  }
}
