import { Body, Controller, Post, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
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

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registra novo usuário e retorna JWT' })
  register(@Body() body: RegisterDTO, @Req() req: any) {
    // Get tenant slug from middleware (set by TenantMiddleware)
    // Only pass if it's a valid non-empty string
    const tenantSlug = req.tenantSlug && req.tenantSlug.trim().length > 0 
      ? req.tenantSlug.trim() 
      : undefined;
    return this.authService.register(
      body.name,
      body.email,
      body.password,
      body.passwordConfirmation,
      tenantSlug,
    );
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Sends password reset email' })
  async forgotPassword(@Body() body: ForgotPasswordDTO, @Req() req: any) {
    // Get tenant slug from middleware (set by TenantMiddleware)
    const tenantSlug = req.tenantSlug && req.tenantSlug.trim().length > 0 
      ? req.tenantSlug.trim() 
      : undefined;
    return this.authService.forgotPassword(body.email, tenantSlug);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Resets password using reset token' })
  resetPassword(@Body() body: ResetPasswordDTO) {
    return this.authService.resetPassword(
      body.token,
      body.password,
      body.passwordConfirmation,
    );
  }
}
