import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, _: any, next: () => void) {
    const host = req.headers.host;

    if (host) {
      const [subdomain] = host.split('.');
      req.tenantSlug = subdomain;
    }

    next();
  }
}
