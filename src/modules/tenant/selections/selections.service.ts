import { Inject, Injectable } from '@nestjs/common';
import { DataSource, Not, Repository } from 'typeorm';
import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
import { Department } from '../entities/department.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class SelectionsService {
  private readonly departmentsRepo: Repository<Department>;
  private readonly rolesRepo: Repository<Role>;

  constructor(
    @Inject(CONNECTION)
    private readonly connection: DataSource,
  ) {
    this.departmentsRepo = this.connection.getRepository(Department);
    this.rolesRepo = this.connection.getRepository(Role);
  }

  async getDepartmentsForSelection(): Promise<Department[]> {
    return this.departmentsRepo.find({
      order: { name: 'ASC' },
      select: ['id', 'name'],
    });
  }

  async getRolesForSelection(): Promise<Role[]> {
    return this.rolesRepo.find({
      where: { name: Not('bakery manager') },
      order: { name: 'ASC' },
      select: ['id', 'name'],
    });
  }
}
