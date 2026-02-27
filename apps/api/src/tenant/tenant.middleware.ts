import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, _: any, next: () => void) {
    const host = req.headers.host;
    const tenantHeader = req.headers['x-tenant-slug'] || req.headers['X-Tenant-Slug'];

    if (tenantHeader && tenantHeader.trim().length > 0) {
      req.tenantSlug = tenantHeader.trim();
    } else if (host) {
      const hostWithoutPort = host.split(':')[0];
      
      const isLocalhost = hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1';
      const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort);
      
      if (!isLocalhost && !isIpAddress && hostWithoutPort.includes('.')) {
        const [subdomain] = hostWithoutPort.split('.');
        if (subdomain && subdomain.length > 0) {
          req.tenantSlug = subdomain;
        }
      }
    }

    if (!req.tenantSlug) {
      req.tenantSlug = 'default';
    }

    next();
  }
}
