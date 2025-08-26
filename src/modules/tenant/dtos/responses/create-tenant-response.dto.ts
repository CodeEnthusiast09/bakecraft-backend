import { Expose } from 'class-transformer';
import { BaseResponseDto } from './base-response.dto';
import { Tenant } from 'src/modules/public/entities/tenants.entity';
import { TenantStatus } from 'src/common/enums';

export class TenantResponseDto extends BaseResponseDto {
  @Expose()
  company_name: string;

  @Expose()
  company_email: string;

  @Expose()
  company_phone_number: string;

  @Expose()
  slug: string;

  @Expose()
  status: TenantStatus;

  constructor(entity: Tenant) {
    super();

    this.id = String(entity.id);

    this.created_at = entity.created_at;

    this.updated_at = entity.updated_at;

    this.company_name = entity.company_name;

    this.company_email = entity.company_email;

    this.company_phone_number = entity.company_phone_number;

    this.slug = entity.slug;

    this.status = entity.status;
  }
}
