import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { EmailService } from '../email/email.service';
import { Role } from '../entities/role.entity';
import { getTenantConnection } from 'src/modules/tenancy/tenancy.utils';
import { Tenant } from 'src/modules/public/entities/tenant.entity';
import publicDatasource from 'src/modules/public/public-orm.config';
import { Department } from '../entities/department.entity';

@Injectable()
export class UsersService {
  private readonly userRepo: Repository<User>;

  constructor(
    @Inject(CONNECTION)
    private readonly connection: DataSource,
    private readonly emailService: EmailService,
  ) {
    this.userRepo = this.connection.getRepository(User);
  }

  async create(signUpDto: SignUpDto, tenantSlug?: string): Promise<User> {
    const tenant = await publicDatasource
      .getRepository(Tenant)
      .findOne({ where: { slug: tenantSlug } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const tenantDs = await getTenantConnection(tenant.id);

    const userRepo = tenantDs.getRepository(User);

    const roleRepo = tenantDs.getRepository(Role);

    const departmentRepo = tenantDs.getRepository(Department);

    const hashedPassword = signUpDto.password
      ? await bcrypt.hash(signUpDto.password, 10)
      : '';

    const userCount = await userRepo.count();

    let role: Role | null;

    let department: Department | null = null;

    if (userCount === 0) {
      role = await roleRepo.findOne({ where: { name: 'bakery manager' } });

      if (!role) {
        throw new NotFoundException('Bakery manager role not found');
      }
    } else {
      const { role: roleId, department: deptId } = signUpDto as SignUpDto & {
        role?: string;
        department?: string;
      };

      if (!roleId) {
        throw new BadRequestException('Role is required for invited users');
      }

      role = await roleRepo.findOne({ where: { id: roleId } });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      if (deptId) {
        department = await departmentRepo.findOne({ where: { id: deptId } });
        if (!department) {
          throw new NotFoundException('Department not found');
        }
      }
    }

    const userData = {
      ...signUpDto,
      password: hashedPassword,
      role,
      ...(department ? { department } : {}),
    };

    const user = userRepo.create(userData);

    const savedUser = await userRepo.save(user);

    if (userCount === 0 && tenantSlug && signUpDto.first_name) {
      await this.emailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.first_name,
        tenantSlug,
      );
    }

    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      relations: [
        'role',
        'department',
        'invited_by',
        'invited_by.role',
        'invited_by.department',
      ],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: [
        'role',
        'department',
        'invited_by',
        'invited_by.role',
        'invited_by.department',
      ],
    });
  }

  async getPersonalDetails(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepo.update(id, updateData);

    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return user;
  }

  async updateInvitedBy(userId: string, invitedById: string): Promise<User> {
    await this.userRepo.update(userId, {
      invited_by: { id: invitedById } as User,
    });

    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updatePersonalDetails(
    user_id: string,
    updateData: Partial<User>,
  ): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: user_id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateData);

    return this.userRepo.save(user);
  }
}
