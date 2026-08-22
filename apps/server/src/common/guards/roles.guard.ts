import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => Reflect.metadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: any): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const user = context.switchToHttp().getRequest().user;
    if (!user) return false;
    return requiredRoles.some((role) => user.role === role);
  }
}
