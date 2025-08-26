import { Expose } from 'class-transformer';

export abstract class BaseResponseDto {
  @Expose()
  id: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
