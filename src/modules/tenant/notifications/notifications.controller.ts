import {
  Controller,
  Sse,
  MessageEvent,
  Param,
  Post,
  Body,
  Get,
  Patch,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dtos/notification.dto';

@Controller('tenants/:tenantId/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // SSE stream per tenant
  @Sse('stream')
  stream(@Param('tenantId') tenantId: string): Observable<MessageEvent> {
    const channel = this.notificationsService.getOrCreateChannel(tenantId);

    return new Observable<MessageEvent>((subscriber) => {
      const subscription = channel.subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        if (channel.observers.length === 0) {
          this.notificationsService.closeChannel(tenantId);
        }
      };
    });
  }

  // Create notification (personal or broadcast)
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  // Fetch notifications for a user
  @Get(':userId')
  findForUser(@Param('userId') userId: string) {
    return this.notificationsService.findForUser(userId);
  }

  // Mark one as read
  @Patch(':notificationId/read')
  markAsRead(@Param('notificationId') notificationId: string) {
    return this.notificationsService.markAsRead(notificationId);
  }

  // Mark all as read
  @Patch(':userId/read-all')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  // Get unread count
  @Get(':userId/unread-count')
  getUnreadCount(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }
}
