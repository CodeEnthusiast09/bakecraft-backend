import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { ApiResponse, successResponse } from 'src/common/utils/response.helper';
import { UserResponseDto } from '../dtos/responses/user-response.dto';
import { LoginDto } from './dto/log-in.dto';
import { InviteUsersDto } from '../dtos/invite-user.dto';
import { ActivateAccountDto } from '../dtos/activate-account.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { PayloadType } from './interface/payload-types';
import { GetUser } from './decorators/get-user.decorator';
import { TenantId } from 'src/common/decorators/tenant.decorator';

@Controller('/tenants/:tenantId/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(
    @Body() dto: SignUpDto,
    @TenantId() tenantId: string,
  ): Promise<ApiResponse<UserResponseDto>> {
    const userResponse = await this.authService.signUp(dto, tenantId);

    return successResponse('User registered successfully', userResponse);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const loginResponse = await this.authService.login(dto);

    return successResponse('Login successful', loginResponse);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  async invite(
    @GetUser() user: PayloadType,
    @Body() dto: InviteUsersDto,
    @TenantId() tenantId: string,
  ): Promise<ApiResponse<UserResponseDto[]>> {
    const invitedUsers = await this.authService.inviteMultiple(
      user.userId,
      dto,
      tenantId,
    );

    return successResponse(
      'Users invited successfully',
      invitedUsers.map((user) => new UserResponseDto(user)),
    );
  }

  @Post('resolve-token')
  async resolveToken(
    @Body() body: { user_id: string; token: string },
  ): Promise<ApiResponse> {
    const result = await this.authService.resolveActivationToken(
      body.user_id,
      body.token,
    );
    return successResponse('Token verified successfully', result);
  }

  @Post('set-password')
  async activateAccount(
    @Body() dto: ActivateAccountDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.authService.activate(dto);

    return successResponse(
      'Account activated successfully',
      new UserResponseDto(user),
    );
  }
}
