import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UpdatePersonalDetailsDto } from '../dtos/update-user-details.dto';
import { UserResponseDto } from '../dtos/responses/user-response.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PayloadType } from '../auth/interface/payload-types';
import { ApiResponse, successResponse } from 'src/common/utils/response.helper';

@Controller('tenants/:tenantId/profile')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('personal-details')
  async getPersonalDetails(
    @GetUser() user: PayloadType,
  ): Promise<ApiResponse<UserResponseDto>> {
    const userDetails = await this.usersService.getPersonalDetails(user.userId);

    return successResponse(
      'User details retrieved succesfully',
      new UserResponseDto(userDetails),
    );
  }

  @Patch('personal-details')
  async updatePersonalDetails(
    @GetUser() user: PayloadType,
    @Body() dto: UpdatePersonalDetailsDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const userDetails = await this.usersService.updatePersonalDetails(
      user.userId,
      dto,
    );

    return successResponse(
      'User details updated succesfully',
      new UserResponseDto(userDetails),
    );
  }
}
