import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      // 1. tenantId obrigatório no token
      if (!payload.tenantId) {
        throw new UnauthorizedException('Tenant not found in token');
      }

      // 2. Verifica se tenant existe
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: payload.tenantId },
      });

      if (!tenant) {
        throw new ForbiddenException('Tenant does not exist');
      }

      // 3. Se middleware definiu tenantSlug, validar
      if (req.tenantSlug && tenant.slug !== req.tenantSlug) {
        throw new ForbiddenException('Tenant mismatch');
      }

      // 4. Injeta contexto no request
      req.user = payload;
      req.tenant = tenant;

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
