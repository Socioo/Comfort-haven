// src/trpc/routers/auth.router.ts
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { AuthService } from '../../auth/auth.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../common/constants';

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['user', 'host'] as const),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRouter = router({
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input, ctx }) => {
      // Since we can't inject services directly, we'll need a different approach
      // Let's create a standalone function or use NestJS's dependency injection
      const authService = new AuthService(
        null as any, // We'll need to pass the repository
        new JwtService({ secret: process.env.JWT_SECRET || 'secret' })
      );
      
      const signUpDto = {
        ...input,
        role: input.role === 'user' ? UserRole.USER : UserRole.HOST,
      };

      const result = await authService.signUp(signUpDto);
      return result;
    }),
    
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const authService = new AuthService(
        null as any,
        new JwtService({ secret: process.env.JWT_SECRET || 'secret' })
      );
      
      const result = await authService.login(input);
      return result;
    }),
    
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }
    return ctx.user;
  }),
});