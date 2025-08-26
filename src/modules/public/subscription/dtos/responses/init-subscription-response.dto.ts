import { Expose } from 'class-transformer';

export class InitializeSubscriptionResponseDto {
  @Expose()
  authorization_url!: string;

  @Expose()
  access_code!: string;

  @Expose()
  reference!: string;
}
