import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsController],
  exports: [NotificationsService, NotificationsController],
})
export class NotificationsModule {}
