import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
import { User } from '../entities/user.entity';
import { Department } from '../entities/department.entity';
import { CreateDepartmentDto } from '../dtos/create-department.dto';

@Injectable()
export class DepartmentsService {
  private readonly departmentsRepo: Repository<Department>;

  constructor(
    @Inject(CONNECTION)
    private readonly connection: DataSource,
  ) {
    this.departmentsRepo = this.connection.getRepository(Department);
  }

  async create(
    user_id: string,
    departmentDto: CreateDepartmentDto,
  ): Promise<Department> {
    const userRepo = this.connection.getRepository(User);

    const creator = await userRepo.findOne({ where: { id: user_id } });

    if (!creator) {
      throw new NotFoundException(`User not found`);
    }

    const department = this.departmentsRepo.create({
      ...departmentDto,
      created_by: creator,
    });

    return this.departmentsRepo.save(department);
  }

  async findAll(): Promise<Department[]> {
    return this.departmentsRepo.find({ order: { name: 'ASC' } });
  }
}
