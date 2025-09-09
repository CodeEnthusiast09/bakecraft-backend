import { Expose } from 'class-transformer';
import { Notification } from '../../entities/notification.entity';
import { BaseResponseDto } from '../../dtos/responses/base-response.dto';

export class NotificationResponseDto {
  @Expose()
  id: string;

  @Expose()
  message: string;

  @Expose()
  type?: string;

  @Expose()
  isRead: boolean;

  @Expose()
  triggeredBy?: { id: string; fullName: string };

  constructor(entity: Notification) {
    this.id = entity.id;

    this.message = entity.message;

    this.type = entity.type;

    this.isRead = entity.isRead;
    if (entity.triggeredBy) {
      this.triggeredBy = {
        id: entity.triggeredBy.id,
        fullName: entity.triggeredBy.full_name,
      };
    }
  }
}
