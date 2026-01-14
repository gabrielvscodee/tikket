import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class UpdateEmailSettingsDTO {
  @ApiProperty({ example: 'smtp.gmail.com', required: false })
  @IsString()
  @IsOptional()
  smtpHost?: string;

  @ApiProperty({ example: 587, required: false })
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  smtpPort?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  smtpSecure?: boolean;

  @ApiProperty({ example: 'your-email@gmail.com', required: false })
  @IsEmail()
  @IsOptional()
  smtpUser?: string;

  @ApiProperty({ example: 'your-password', required: false })
  @IsString()
  @IsOptional()
  smtpPassword?: string;

  @ApiProperty({ example: 'noreply@yourdomain.com', required: false })
  @IsEmail()
  @IsOptional()
  emailFrom?: string;
}
