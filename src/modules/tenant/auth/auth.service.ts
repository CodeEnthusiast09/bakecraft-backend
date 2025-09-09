import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/log-in.dto';
import { UserResponseDto } from '../dtos/responses/user-response.dto';
import { User } from '../entities/user.entity';
import { InviteUserDto, InviteUsersDto } from '../dtos/invite-user.dto';
import { EmailService } from '../email/email.service';
import { ActivateAccountDto } from '../dtos/activate-account.dto';
import { TenantService } from '../tenant.service';
import { PayloadType } from './interface/payload-types';

export interface ActivationTokenPayload {
  email: string;
  type: 'activation';
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly tenantService: TenantService,
  ) {}

  async signUp(dto: SignUpDto, tenantId: string) {
    const tenant = await this.tenantService.getTenantById(tenantId);

    const user = await this.usersService.create(dto, tenant.slug);

    return this.mapToUserResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload: PayloadType = {
      userId: user.id,
      email: user.email,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      user: this.mapToUserResponse(user),
      token,
    };
  }

  async invite(
    userId: string,
    dto: InviteUserDto,
    tenantId: string,
  ): Promise<User> {
    const existing = await this.usersService.findByEmail(dto.email);

    const tenant = await this.tenantService.getTenantById(tenantId);

    if (existing) {
      throw new BadRequestException(
        'A user with this email has already been invited',
      );
    }

    const user = await this.usersService.create(
      {
        ...dto,
        password: '',
        password_confirmation: '',
      },
      tenant.slug,
    );

    // user.invited_by = { id: userId } as User;

    const updatedUser = await this.usersService.updateInvitedBy(
      user.id,
      userId,
    );

    const { activationToken } = this.generateToken({ email: dto.email });

    await this.emailService.sendActivationEmail(
      user.id,
      user.first_name,
      user.email,
      tenant.slug,
      activationToken,
    );

    return updatedUser;
  }

  async inviteMultiple(
    userId: string,
    dto: InviteUsersDto,
    tenantId: string,
  ): Promise<User[]> {
    const invitedUsers: User[] = [];

    for (const invite of dto.invites) {
      const existing = await this.usersService.findByEmail(invite.email);

      const tenant = await this.tenantService.getTenantById(tenantId);

      if (existing) {
        throw new BadRequestException(
          `A user with this email (${invite.email}) has already been invited`,
        );
      }

      const user = await this.usersService.create(
        {
          ...invite,
          password: '',
          password_confirmation: '',
        },
        tenant.slug,
      );

      const updatedUser = await this.usersService.updateInvitedBy(
        user.id,
        userId,
      );

      const { activationToken } = this.generateToken({ email: invite.email });

      await this.emailService.sendActivationEmail(
        user.id,
        user.first_name,
        user.email,
        tenant.slug,
        activationToken,
      );

      invitedUsers.push(updatedUser);
    }

    return invitedUsers;
  }

  async resolveActivationToken(user_id: string, token: string) {
    try {
      const payload = this.jwtService.verify<ActivationTokenPayload>(token);

      if (payload.type !== 'activation') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.usersService.findById(user_id);

      if (!user || user.email !== payload.email) {
        throw new BadRequestException('Token does not match user');
      }

      return { success: true };
    } catch (err) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async activate(dto: ActivateAccountDto): Promise<User> {
    const user = await this.usersService.findById(dto.user_id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.password) {
      throw new BadRequestException('Account already activated');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    user.password = hashed;

    const invitedUser = await this.usersService.update(user.id, {
      password: hashed,
    });

    return invitedUser;
  }

  private mapToUserResponse(user: User): UserResponseDto {
    return new UserResponseDto(user);
  }

  private generateToken(user: { email: string }): {
    activationToken: string;
  } {
    const payload = {
      email: user.email,
      type: 'activation',
    };
    const activationToken = this.jwtService.sign(payload, { expiresIn: '24h' });
    return { activationToken };
  }
}
