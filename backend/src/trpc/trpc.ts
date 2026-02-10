// src/trpc/trpc.ts
import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import { Request, Response } from 'express';
import { UserRole } from '../common/constants';
import { User } from '../users/entities/user.entity';

// Create context type
export const createContext = ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}) => {
  return {
    req,
    res,
    user: null as User | null,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;

// Initialize tRPC
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

// Auth middleware
const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Not authenticated');
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// Role-based middleware
export const createRoleMiddleware = (requiredRole: UserRole) =>
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new Error('Not authenticated');
    }
    
    if (ctx.user.role !== requiredRole && ctx.user.role !== UserRole.ADMIN) {
      throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
    }
    
    return next({
      ctx: {
        user: ctx.user,
      },
    });
  });

export const hostProcedure = protectedProcedure.use(createRoleMiddleware(UserRole.HOST));
export const adminProcedure = protectedProcedure.use(createRoleMiddleware(UserRole.ADMIN));