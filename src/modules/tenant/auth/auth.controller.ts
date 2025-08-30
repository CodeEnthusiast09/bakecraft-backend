import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { ApiResponse, successResponse } from 'src/common/utils/response.helper';
import { UserResponseDto } from '../dtos/responses/user-response.dto';
import { LoginDto } from './dto/log-in.dto';

@Controller('/tenants/:tenantId/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto): Promise<ApiResponse<UserResponseDto>> {
    const userResponse = await this.authService.signUp(dto);

    return successResponse('Signup successful', userResponse);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const loginResponse = await this.authService.login(dto);

    return successResponse('Login successful', loginResponse);
  }
}
