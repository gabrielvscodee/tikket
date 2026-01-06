import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, _: any, next: () => void) {
    const host = req.headers.host;

    if (host) {
      const [subdomain] = host.split('.');
      
      // Only set tenantSlug if it's not localhost or IP address
      // In development, allow login without tenant validation
      if (subdomain && subdomain !== 'localhost' && !subdomain.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        req.tenantSlug = subdomain;
      }
      // For localhost, don't set tenantSlug (allows login without tenant validation)
    }

    next();
  }
}
