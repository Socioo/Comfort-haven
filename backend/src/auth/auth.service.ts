import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserRole } from '../common/constants';
import { User } from '../users/entities/user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const email = signUpDto.email.toLowerCase().trim();
    const existingUser = await this.usersRepository.findOne({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    // Create user
    const user = this.usersRepository.create({
      ...signUpDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    // Notify admins about new user registration
    try {
        await this.notificationsService.notifyAdmins({
            type: 'success',
            title: `New ${savedUser.role} Joined`,
            message: `${savedUser.name} has just registered as a ${savedUser.role}.`,
            metadata: { userId: savedUser.id }
        });
    } catch (e) {
        console.error('Failed to send registration notification', e);
    }

    const tokens = await this.getTokens(savedUser);
    await this.updateRefreshToken(savedUser.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserDto(savedUser),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const email = loginDto.email.toLowerCase().trim();
    console.log('AuthService.login attempt for:', email);
    
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'phone', 'password', 'role', 'profileImage', 'isVerified', 'mustChangePassword'],
    });

    if (!user) {
      console.log('User not found for email:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('User found, validating password...');
    console.log(`Debug: Password to check length: ${loginDto.password?.length}`);
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log(`Debug: Comparison failed. Provided: ${loginDto.password?.length} chars, Stored Hash starts with: ${user.password?.substring(0, 10)}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserDto(user),
    };
  }

  async googleLogin(googleUser: {
    email: string;
    name: string;
    googleId: string;
    profileImage?: string;
  }) {
    let user = await this.usersRepository.findOne({
      where: [{ email: googleUser.email }, { googleId: googleUser.googleId }],
    });

    if (!user) {
      user = this.usersRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        profileImage: googleUser.profileImage,
        isVerified: true,
        role: UserRole.USER,
      });
      await this.usersRepository.save(user);
    } else if (!user.googleId) {
      user.googleId = googleUser.googleId;
      if (googleUser.profileImage) {
        user.profileImage = googleUser.profileImage;
      }
      await this.usersRepository.save(user);
    }

    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserDto(user),
    };
  }

  async logout(userId: string) {
    return this.usersRepository.update(userId, { hashedRefreshToken: null as any });
  }

  async refreshTokens(refreshToken: string) {
    // Verify token (simple verify, in real app use proper strategy/secret)
    let payload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    if (!payload || !payload.sub) {
       throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.findOne({ 
      where: { id: payload.sub },
      select: ['id', 'email', 'name', 'phone', 'role', 'profileImage', 'isVerified', 'hashedRefreshToken'] // select hash
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      access_token: tokens.accessToken, // Matching frontend expectation snake_case
      refresh_token: tokens.refreshToken,
      accessToken: tokens.accessToken, // Keeping camelCase for consistency if needed
      refreshToken: tokens.refreshToken,
    };
  }

  async updateProfile(userId: string, updateData: any) {
    await this.usersRepository.update(userId, updateData);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.toUserDto(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.toUserDto(user);
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      hashedRefreshToken: hash,
    });
  }

  async getTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }), // Short lived
      this.jwtService.signAsync(payload, { expiresIn: '7d' }), // Long lived
    ]);

    return {
      accessToken: at,
      refreshToken: rt,
    };
  }

  private toUserDto(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      photoUrl: user.profileImage, // Alias for mobile app compatibility
      isVerified: user.isVerified,
      mustChangePassword: user.mustChangePassword,
      notifications: user.notifications,
    };
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id: userId },
    });
  }
}