import { Expose } from 'class-transformer';
import { BaseResponseDto } from './base-response.dto';
import { Role } from '../../entities/role.entity';
import { UserResponseDto } from './user-response.dto';

export class RoleResponseDto extends BaseResponseDto {
  @Expose()
  name: string;

  @Expose()
  created_by: UserResponseDto | null;

  constructor(entity: Role) {
    super();
    this.id = String(entity.id);

    this.name = entity.name;

    this.created_at = entity.created_at;

    this.updated_at = entity.updated_at;

    this.created_by = entity.created_by
      ? new UserResponseDto(entity.created_by)
      : null;
  }
}
