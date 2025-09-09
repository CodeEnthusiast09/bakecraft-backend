import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class RolesService {
  private readonly rolesRepo: Repository<Role>;

  constructor(
    @Inject(CONNECTION)
    private readonly connection: DataSource,
  ) {
    this.rolesRepo = this.connection.getRepository(Role);
  }

  async create(user_id: string, roleDto: CreateRoleDto): Promise<Role> {
    const userRepo = this.connection.getRepository(User);

    const creator = await userRepo.findOne({ where: { id: user_id } });

    if (!creator) {
      throw new NotFoundException(`User not found`);
    }

    const role = this.rolesRepo.create({
      ...roleDto,
      created_by: creator,
    });

    return this.rolesRepo.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepo.find({ order: { name: 'ASC' } });
  }
}
