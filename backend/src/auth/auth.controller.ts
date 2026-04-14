import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe, Get, Patch, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google Authentication' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        googleId: { type: 'string' },
        profileImage: { type: 'string' },
      },
      required: ['email', 'name', 'googleId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Google login successful.', type: AuthResponseDto })
  async googleLogin(@Body() body: { email: string; name: string; googleId: string; profileImage?: string; role?: any }) {
    console.log('AuthController.googleLogin - Incoming Body:', JSON.stringify(body, null, 2));
    return this.authService.googleLogin(body);
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apple Authentication' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        appleId: { type: 'string' },
      },
      required: ['email', 'name', 'appleId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Apple login successful.', type: AuthResponseDto })
  async appleLogin(@Body() body: { email: string; name: string; appleId: string; role?: any }) {
    console.log('AuthController.appleLogin - Incoming Body:', JSON.stringify(body, null, 2));
    return this.authService.appleLogin(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully.' })
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body || !body.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req) {
    return this.authService.logout(req.user.id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req, @Body() body: any) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiResponse({ status: 200, description: 'Reset code sent if email exists.' })
  async forgotPassword(@Body() body: { email: string }) {
    if (!body || !body.email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with code' })
  @ApiResponse({ status: 200, description: 'Password reset successful.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired code.' })
  async resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    if (!body || !body.email || !body.otp || !body.newPassword) {
      throw new BadRequestException('Email, OTP, and new password are required');
    }
    return this.authService.resetPassword(body.email, body.otp, body.newPassword);
  }
}
