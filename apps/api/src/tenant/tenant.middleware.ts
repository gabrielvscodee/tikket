import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, _: any, next: () => void) {
    const host = req.headers.host;
    const tenantHeader = req.headers['x-tenant-slug'] || req.headers['X-Tenant-Slug'];

    // URLs de produção/demo que sempre devem usar tenant "default"
    const demoHosts = [
      'tikket-api.onrender.com',
      'tikket-web.vercel.app',
    ];

    const hostWithoutPort = host ? host.split(':')[0] : '';
    const isDemoHost = demoHosts.some(demoHost => 
      hostWithoutPort === demoHost || hostWithoutPort.endsWith(`.${demoHost}`)
    );

    if (isDemoHost) {
      req.tenantSlug = 'default';
    } else if (tenantHeader && tenantHeader.trim().length > 0) {
      req.tenantSlug = tenantHeader.trim();
    } else if (host) {
      const isLocalhost = hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1';
      const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort);
      
      if (!isLocalhost && !isIpAddress && hostWithoutPort.includes('.')) {
        const [subdomain] = hostWithoutPort.split('.');
        if (subdomain && subdomain.length > 0 && subdomain !== 'www') {
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
