import { Expose } from 'class-transformer';
import { BaseResponseDto } from './base-response.dto';
import { UserResponseDto } from './user-response.dto';
import { Department } from '../../entities/department.entity';

export class DepartmentResponseDto extends BaseResponseDto {
  @Expose()
  name: string;

  @Expose()
  created_by: UserResponseDto | null;

  constructor(entity: Department) {
    super();
    this.id = String(entity.id);

    this.created_at = entity.created_at;

    this.updated_at = entity.updated_at;

    this.name = entity.name;

    this.created_by = entity.created_by
      ? new UserResponseDto(entity.created_by)
      : null;
  }
}
