import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, _: any, next: () => void) {
    const host = req.headers.host;

    if (host) {
      // Remove port if present (e.g., "localhost:3001" -> "localhost")
      const hostWithoutPort = host.split(':')[0];
      
      // Check if it's localhost or IP address
      const isLocalhost = hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1';
      const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort);
      
      // Only extract subdomain if it's not localhost/IP and has dots (subdomain.domain.com)
      if (!isLocalhost && !isIpAddress && hostWithoutPort.includes('.')) {
        const [subdomain] = hostWithoutPort.split('.');
        // Only set if subdomain exists and is not empty
        if (subdomain && subdomain.length > 0) {
          req.tenantSlug = subdomain;
        }
      }
      // For localhost/IP, don't set tenantSlug (allows login without tenant validation)
    }

    next();
  }
}
