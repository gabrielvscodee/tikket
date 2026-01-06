import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Realiza login e retorna JWT' })
  login(@Body() body: LoginDTO, @Req() req: any) {
    // Get tenant slug from middleware (set by TenantMiddleware)
    // Only pass if it's a valid non-empty string
    const tenantSlug = req.tenantSlug && req.tenantSlug.trim().length > 0 
      ? req.tenantSlug.trim() 
      : undefined;
    return this.authService.login(body.email, body.password, tenantSlug);
  }
}
