import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Simple check: is user exists and has the role?
    // If we want to allow 'admin' to do everything 'user' can, we might need hierarchy logic.
    // For now, exact match or if user is admin they can usually do anything.
    if (!user) return false;
    
    if (user.role === 'admin') return true;

    return roles.includes(user.role);
  }
}
