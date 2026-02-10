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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: signUpDto.email },
    });

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

    await this.usersRepository.save(user);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user with password selected
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      select: ['id', 'email', 'name', 'phone', 'password', 'role', 'profileImage', 'isVerified'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
      },
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
      // Create new user for Google sign-in
      user = this.usersRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        profileImage: googleUser.profileImage,
        isVerified: true,
        role: UserRole.USER, // Default role for Google sign-ups
      });

      await this.usersRepository.save(user);
    } else if (!user.googleId) {
      // Link Google account to existing email
      user.googleId = googleUser.googleId;
      if (googleUser.profileImage) {
        user.profileImage = googleUser.profileImage;
      }
      await this.usersRepository.save(user);
    }

    const token = this.generateToken(user);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
      },
    };
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id: userId },
    });
  }
}