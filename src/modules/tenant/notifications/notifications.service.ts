// import {
//   BadRequestException,
//   Inject,
//   Injectable,
//   NotFoundException,
//   Logger,
// } from '@nestjs/common';
// import { DataSource, Repository, IsNull } from 'typeorm';
// import { Subject } from 'rxjs';
// import { Notification } from '../entities/notification.entity';
// import { CreateNotificationDto } from './dtos/notification.dto';
// import { User } from '../entities/user.entity';
// import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
// import { MessageEvent } from '@nestjs/common';

// @Injectable()
// export class NotificationsService {
//   private readonly logger = new Logger(NotificationsService.name);
//   private readonly notificationRepo: Repository<Notification>;
//   private channels: Record<string, Subject<MessageEvent>> = {};

//   constructor(@Inject(CONNECTION) private readonly connection: DataSource) {
//     this.notificationRepo = this.connection.getRepository(Notification);
//   }

//   async create(
//     dto: CreateNotificationDto,
//     tenantId: string,
//   ): Promise<Notification> {
//     try {
//       const notificationData: Partial<Notification> = {
//         message: dto.message,
//         type: dto.type,
//         recipient: dto.recipientId ? ({ id: dto.recipientId } as User) : null,
//         triggeredBy: dto.triggeredBy ? ({ id: dto.triggeredBy } as User) : null,
//       };

//       const notification = this.notificationRepo.create(notificationData);

//       const saved = await this.notificationRepo.save(notification);

//       this.logger.log(`Created notification for tenant: ${tenantId}`);

//       this.emitToChannel(tenantId, {
//         data: JSON.stringify(saved),
//         type: 'notification',
//         id: saved.id,
//         retry: 10000,
//       });

//       return saved;
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         this.logger.error('Failed to create notification', err.stack);
//       } else {
//         this.logger.error('Failed to create notification', String(err));
//       }
//       throw new BadRequestException('Unable to create notification');
//     }
//   }

//   async findForUser(userId: string): Promise<Notification[]> {
//     try {
//       return await this.notificationRepo.find({
//         where: [{ recipient: { id: userId } }, { recipient: IsNull() }],
//         order: { created_at: 'DESC' },
//         relations: ['recipient', 'triggeredBy'],
//       });
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         this.logger.error('Failed to fetch notification', err.stack);
//       } else {
//         this.logger.error('Failed to fetch notification', String(err));
//       }
//       throw new BadRequestException('Unable to fetch notification');
//     }
//   }

//   async markAsRead(notificationId: string): Promise<Notification> {
//     const notification = await this.notificationRepo.findOneBy({
//       id: notificationId,
//     });

//     if (!notification) {
//       throw new NotFoundException('Notification not found');
//     }

//     notification.isRead = true;
//     return this.notificationRepo.save(notification);
//   }

//   async markAllAsRead(userId: string) {
//     return this.notificationRepo.update(
//       { recipient: { id: userId }, isRead: false },
//       { isRead: true },
//     );
//   }

//   async getUnreadCount(userId: string): Promise<number> {
//     return this.notificationRepo.count({
//       where: { recipient: { id: userId }, isRead: false },
//     });
//   }

//   // --- SSE Channel Management ---
//   getOrCreateChannel(tenantId: string): Subject<MessageEvent> {
//     if (!this.channels[tenantId]) {
//       this.channels[tenantId] = new Subject<MessageEvent>();
//     }
//     return this.channels[tenantId];
//   }

//   private emitToChannel(tenantId: string, event: MessageEvent) {
//     console.log('Emitting SSE event:', JSON.stringify(event, null, 2));
//     if (this.channels[tenantId]) {
//       this.channels[tenantId].next(event);
//     }
//   }

//   closeChannel(tenantId: string) {
//     if (this.channels[tenantId]) {
//       this.channels[tenantId].complete();
//       delete this.channels[tenantId];
//     }
//   }
// }

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from './dtos/notification.dto';
import { User } from '../entities/user.entity';
import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
import { MessageEvent } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly notificationRepo: Repository<Notification>;
  private channels: Map<string, Subject<MessageEvent>> = new Map();
  private connectionCounts: Map<string, number> = new Map();

  constructor(@Inject(CONNECTION) private readonly connection: DataSource) {
    this.notificationRepo = this.connection.getRepository(Notification);
  }

  async create(
    dto: CreateNotificationDto,
    tenantId: string,
  ): Promise<Notification> {
    try {
      this.logger.log(`Starting notification creation for tenant: ${tenantId}`);
      this.logger.log(`Notification DTO:`, JSON.stringify(dto, null, 2));

      const notificationData: Partial<Notification> = {
        message: dto.message,
        type: dto.type,
        recipient: dto.recipientId ? ({ id: dto.recipientId } as User) : null,
        triggeredBy: dto.triggeredBy ? ({ id: dto.triggeredBy } as User) : null,
      };

      const notification = this.notificationRepo.create(notificationData);
      const saved = await this.notificationRepo.save(notification);

      this.logger.log(
        `✅ Created notification with ID: ${saved.id} for tenant: ${tenantId}`,
      );

      // Check channel status before emitting
      const channelStatus = this.getChannelStatus(tenantId);
      this.logger.log(
        `Channel status before emit:`,
        JSON.stringify(channelStatus, null, 2),
      );

      // Emit to SSE channel immediately after creation
      const eventToEmit: MessageEvent = {
        data: JSON.stringify(saved),
        type: 'notification',
        id: saved.id,
        retry: 10000,
      };

      this.logger.log(
        `About to emit event:`,
        JSON.stringify(eventToEmit, null, 2),
      );

      this.emitToChannel(tenantId, eventToEmit);

      return saved;
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error('Failed to create notification', err.stack);
      } else {
        this.logger.error('Failed to create notification', String(err));
      }
      throw new BadRequestException('Unable to create notification');
    }
  }

  async findForUser(userId?: string): Promise<Notification[]> {
    try {
      const where = userId
        ? [{ recipient: { id: userId } }, { recipient: IsNull() }]
        : [{ recipient: IsNull() }];
      return await this.notificationRepo.find({
        where,
        order: { created_at: 'DESC' },
        relations: ['recipient', 'triggeredBy'],
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error('Failed to fetch notification', err.stack);
      } else {
        this.logger.error('Failed to fetch notification', String(err));
      }
      throw new BadRequestException('Unable to fetch notification');
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOneBy({
      id: notificationId,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepo.update(
      [
        { recipient: { id: userId }, isRead: false },
        { recipient: IsNull(), isRead: false },
      ],
      { isRead: true },
    );
  }

  async getUnreadCount(userId?: string): Promise<{ count: number }> {
    const where = userId
      ? [{ recipient: { id: userId }, isRead: false }, { recipient: IsNull(), isRead: false }]
      : [{ isRead: false }];

    const unreadCount = await this.notificationRepo.count({ where });

    return { count: unreadCount };
  }

  // --- SSE Channel Management ---
  getOrCreateChannel(tenantId: string): Observable<MessageEvent> {
    // Always ensure we have a fresh channel
    if (!this.channels.has(tenantId) || this.channels.get(tenantId)?.closed) {
      this.channels.set(tenantId, new Subject<MessageEvent>());
      this.connectionCounts.set(tenantId, 0);
      this.logger.log(`🆕 Created fresh SSE channel for tenant: ${tenantId}`);
    }

    const subject = this.channels.get(tenantId)!;

    return new Observable<MessageEvent>((subscriber) => {
      // Increment connection count
      const currentCount = this.connectionCounts.get(tenantId) || 0;
      this.connectionCounts.set(tenantId, currentCount + 1);
      this.logger.log(
        `📡 New SSE subscriber for tenant: ${tenantId}, total connections: ${currentCount + 1}`,
      );

      const subscription = subject.subscribe({
        next: (event) => {
          this.logger.log(
            `📤 Sending SSE event to tenant ${tenantId}:`,
            JSON.stringify(event),
          );
          subscriber.next(event);
        },
        error: (err) => {
          this.logger.error(`❌ SSE error for tenant ${tenantId}:`, err);
          subscriber.error(err);
        },
        complete: () => {
          this.logger.log(`✅ SSE stream completed for tenant: ${tenantId}`);
          subscriber.complete();
        },
      });

      // Cleanup function
      return () => {
        subscription.unsubscribe();

        // Decrement connection count
        const count = this.connectionCounts.get(tenantId) || 1;
        const newCount = Math.max(0, count - 1);
        this.connectionCounts.set(tenantId, newCount);

        this.logger.log(
          `📡 SSE subscriber disconnected for tenant: ${tenantId}, remaining connections: ${newCount}`,
        );

        // Only schedule cleanup if no connections remain
        if (newCount === 0) {
          setTimeout(() => {
            const finalCount = this.connectionCounts.get(tenantId) || 0;
            if (finalCount === 0) {
              this.logger.log(
                `🧹 Cleaning up unused channel for tenant: ${tenantId}`,
              );
              this.closeChannel(tenantId);
            }
          }, 30000); // 30 second delay for reconnections
        }
      };
    });
  }

  private emitToChannel(tenantId: string, event: MessageEvent) {
    this.logger.log(`🚀 Attempting to emit SSE event for tenant ${tenantId}`);

    // Always ensure we have an active channel before emitting
    if (!this.channels.has(tenantId) || this.channels.get(tenantId)?.closed) {
      this.logger.log(
        `🔄 Creating new channel for tenant ${tenantId} during emit`,
      );
      this.channels.set(tenantId, new Subject<MessageEvent>());
      this.connectionCounts.set(tenantId, 0);
    }

    const channel = this.channels.get(tenantId)!;

    try {
      channel.next(event);
      this.logger.log(
        `✅ Successfully emitted SSE event for tenant ${tenantId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to emit SSE event for tenant ${tenantId}:`,
        error,
      );
    }
  }

  closeChannel(tenantId: string) {
    const channel = this.channels.get(tenantId);
    if (channel && !channel.closed) {
      channel.complete();
    }
    this.channels.delete(tenantId);
    this.connectionCounts.delete(tenantId);
    this.logger.log(
      `🗑️ Closed and removed SSE channel for tenant: ${tenantId}`,
    );
  }

  // Method to send heartbeat/keepalive
  sendHeartbeat(tenantId: string) {
    this.emitToChannel(tenantId, {
      data: JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      }),
      type: 'heartbeat',
    });
  }

  // Debug method to check channel status
  getChannelStatus(tenantId: string) {
    const channel = this.channels.get(tenantId);
    const connectionCount = this.connectionCounts.get(tenantId) || 0;

    return {
      hasChannel: !!channel,
      isClosed: channel?.closed || false,
      connectionCount,
      allTenants: Array.from(this.channels.keys()),
    };
  }
}
