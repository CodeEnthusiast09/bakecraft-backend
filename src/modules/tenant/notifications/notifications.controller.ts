// import {
//   Controller,
//   Sse,
//   MessageEvent,
//   Param,
//   Post,
//   Body,
//   Get,
//   Patch,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { NotificationsService } from './notifications.service';
// import { CreateNotificationDto } from './dtos/notification.dto';
// import { TenantId } from 'src/common/decorators/tenant.decorator';
// import { Public } from 'src/common/decorators/public.decorator';

// @Controller('tenants/:tenantId/notifications')
// export class NotificationsController {
//   constructor(private readonly notificationsService: NotificationsService) {}

//   // SSE stream per tenant
//   @Sse('stream')
//   @Public()
//   stream(@Param('tenantId') tenantId: string): Observable<MessageEvent> {
//     const channel = this.notificationsService.getOrCreateChannel(tenantId);

//     console.log('In controller', tenantId);

//     return new Observable<MessageEvent>((subscriber) => {
//       const subscription = channel.subscribe(subscriber);
//       return () => {
//         subscription.unsubscribe();
//         if (channel.observers.length === 0) {
//           this.notificationsService.closeChannel(tenantId);
//         }
//       };
//     });
//   }

//   // Create notification (personal or broadcast)
//   @Post()
//   create(
//     @Body() dto: CreateNotificationDto,
//     @Param('tenantId') tenantId: string,
//   ) {
//     return this.notificationsService.create(dto, tenantId);
//   }

//   // Fetch notifications for a user
//   @Get(':userId')
//   findForUser(@Param('userId') userId: string) {
//     return this.notificationsService.findForUser(userId);
//   }

//   // Mark one as read
//   @Patch(':notificationId/read')
//   markAsRead(@Param('notificationId') notificationId: string) {
//     return this.notificationsService.markAsRead(notificationId);
//   }

//   // Mark all as read
//   @Patch(':userId/read-all')
//   markAllAsRead(@Param('userId') userId: string) {
//     return this.notificationsService.markAllAsRead(userId);
//   }

//   // Get unread count
//   @Get(':userId/unread-count')
//   getUnreadCount(@Param('userId') userId: string) {
//     return this.notificationsService.getUnreadCount(userId);
//   }
// }

import {
  Controller,
  Sse,
  MessageEvent,
  Param,
  Post,
  Body,
  Get,
  Patch,
  Headers,
  Res,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';
import { Response } from 'express';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dtos/notification.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiResponse, successResponse } from 'src/common/utils/response.helper';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { Notification } from '../entities/notification.entity';

@Controller('tenants/:tenantId/notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // SSE stream with proper headers
  @Sse('stream')
  @Public()
  stream(
    @Param('tenantId') tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ): Observable<MessageEvent> {
    this.logger.log(`🔌 SSE connection established for tenant: ${tenantId}`);

    // Set proper SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    return this.notificationsService.getOrCreateChannel(tenantId).pipe(
      startWith({
        data: JSON.stringify({
          message: 'SSE connection established',
          tenantId,
          timestamp: new Date().toISOString(),
        }),
        type: 'connection',
      } as MessageEvent),
      tap((event) => {
        this.logger.log(
          `📡 Streaming event for tenant ${tenantId}:`,
          event.type,
        );
      }),
    );
  }

  // Simpler stream endpoint
  @Sse('simple-stream')
  @Public()
  simpleStream(
    @Param('tenantId') tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ): Observable<MessageEvent> {
    this.logger.log(`🔌 Simple SSE connection for tenant: ${tenantId}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return this.notificationsService.getOrCreateChannel(tenantId).pipe(
      startWith({
        data: JSON.stringify({
          message: 'Connection established',
          tenantId,
          timestamp: new Date().toISOString(),
        }),
        type: 'connection',
      } as MessageEvent),
    );
  }

  // Create notification
  @Post()
  create(
    @Body() dto: CreateNotificationDto,
    @Param('tenantId') tenantId: string,
  ) {
    this.logger.log(`📝 Creating notification for tenant: ${tenantId}`);
    return this.notificationsService.create(dto, tenantId);
  }

  // Fetch notifications for a user
  @Get()
  async findForUser(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<Notification[]>> {
    const userNotif = await this.notificationsService.findForUser();

    return successResponse('Notification retrieved successfully', userNotif);
  }

  // Mark one as read
  @Patch(':notificationId/read')
  async markAsRead(
    @Param('notificationId') notificationId: string,
  ): Promise<ApiResponse<Notification>> {
    const isMarkedRead =
      await this.notificationsService.markAsRead(notificationId);

    return successResponse('Notification marked as read', isMarkedRead);
  }

  // Mark all as read
  @Patch(':userId/read-all')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  // Get unread count
  @Get('/unread-count')
  async getUnreadCount(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<{ count: number }>> {
    const count = await this.notificationsService.getUnreadCount();

    return successResponse('Unread count retrieved successfully', count);
  }

  // Manual test endpoint
  @Post('test')
  @Public()
  testNotification(@Param('tenantId') tenantId: string) {
    this.logger.log(`🧪 Creating test notification for tenant: ${tenantId}`);
    return this.notificationsService.create(
      {
        message: 'Test notification from manual trigger',
        type: 'test',
        recipientId: null,
        triggeredBy: null,
      },
      tenantId,
    );
  }

  // Debug endpoint to check channel status
  @Get('debug/channel-status')
  @Public()
  getChannelStatus(@Param('tenantId') tenantId: string) {
    return this.notificationsService.getChannelStatus(tenantId);
  }
}
