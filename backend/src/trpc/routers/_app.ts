// src/trpc/routers/_app.ts
import { router } from '../trpc';
import { authRouter } from './auth.router';

export const appRouter = router({
  auth: authRouter,
  // Add other routers here
});

export type AppRouter = typeof appRouter;