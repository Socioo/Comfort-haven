import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../common/constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user }: { user: User } = context.switchToHttp().getRequest();
    
    if (!user) {
      console.error('RolesGuard: No user found in request. JWT Auth might have failed.');
      throw new ForbiddenException('User not authenticated');
    }

    console.log(`RolesGuard: User ${user.email} with role ${user.role} attempting to access ${context.getHandler().name}`);
    console.log(`RolesGuard: Required roles: ${requiredRoles.join(', ')}`);

    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      console.error(`RolesGuard: Permission denied for user ${user.email}. Role ${user.role} not in [${requiredRoles.join(', ')}]`);
      throw new ForbiddenException(`Required role: ${requiredRoles.join(' or ')}`);
    }

    console.log('RolesGuard: Permission granted.');
    return true;
  }
}