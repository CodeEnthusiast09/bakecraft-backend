import { Expose } from 'class-transformer';
import { BaseResponseDto } from './base-response.dto';
import { User } from '../../entities/user.entity';
import { RoleResponseDto } from './role-response.dto';
import { DepartmentResponseDto } from './department-response.dto';

export class UserResponseDto extends BaseResponseDto {
  @Expose()
  first_name: string;

  @Expose()
  last_name: string;

  @Expose()
  email: string;

  @Expose()
  phone_number: string;

  @Expose()
  role: RoleResponseDto | null;

  @Expose()
  department: DepartmentResponseDto | null;

  @Expose()
  invited_by: UserResponseDto | null;

  constructor(entity: User) {
    super();
    this.id = String(entity.id);

    this.created_at = entity.created_at;

    this.updated_at = entity.updated_at;

    this.first_name = entity.first_name;

    this.last_name = entity.last_name;

    this.email = entity.email;

    this.role = entity.role ? new RoleResponseDto(entity.role) : null;

    this.department = entity.department
      ? new DepartmentResponseDto(entity.department)
      : null;

    this.phone_number = entity.phone_number;

    this.invited_by = entity.invited_by
      ? new UserResponseDto(entity.invited_by)
      : null;
  }
}
