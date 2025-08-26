import { Expose } from 'class-transformer';
import { BaseResponseDto } from './base-response.dto';
import { User } from '../../entities/user.entity';

export class UserResponseDto extends BaseResponseDto {
  @Expose()
  first_name: string;

  @Expose()
  last_name: string;

  @Expose()
  email: string;

  @Expose()
  phone_number: string;

  constructor(entity: User) {
    super();
    this.id = String(entity.id);

    this.created_at = entity.created_at;

    this.updated_at = entity.updated_at;

    this.first_name = entity.first_name;

    this.last_name = entity.last_name;

    this.email = entity.email;

    this.phone_number = entity.phone_number;
  }
}
