// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'Comfort Haven API',
      version: '1.0.0',
      endpoints: {
        auth: {
          signup: 'POST /auth/signup',
          login: 'POST /auth/login',
          google: 'POST /auth/google'
        }
      },
      status: 'running'
    };
  }
}