// import { Inject, Injectable } from '@nestjs/common';
// import { DataSource, IsNull, Repository } from 'typeorm';
// import { Subject } from 'rxjs';
// import { Notification } from '../entities/notification.entity';
// import { CreateNotificationDto } from './dtos/notification.dto';
// import { User } from '../entities/user.entity';
// import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
// import { MessageEvent } from '@nestjs/common';

// @Injectable()
// export class NotificationsService {
//   private readonly notificationRepo: Repository<Notification>;
//   private channels: Record<string, Subject<MessageEvent>> = {};

//   constructor(
//     @Inject(CONNECTION)
//     private readonly connection: DataSource,
//   ) {
//     this.notificationRepo = this.connection.getRepository(Notification);
//   }

//   async create(dto: CreateNotificationDto) {
//     const notificationData: Partial<Notification> = {
//       message: dto.message,
//       type: dto.type,
//     };

//     if (dto.recipientId) {
//       notificationData.recipient = { id: dto.recipientId } as User;
//     }

//     if (dto.triggeredBy) {
//       notificationData.triggeredBy = { id: dto.triggeredBy } as User;
//     }

//     const notification = this.notificationRepo.create(notificationData);
//     const saved = await this.notificationRepo.save(notification);

//     // Emit to SSE stream
//     const tenantId = this.connection.options.database as string;
//     this.emitToChannel(tenantId, {
//       data: saved,
//       type: 'notification',
//       id: saved.id,
//     });

//     return saved;
//   }

//   async findForUser(userId: string) {
//     return this.notificationRepo.find({
//       where: [{ recipient: { id: userId } }, { recipient: IsNull() }],
//       order: { created_at: 'DESC' },
//     });
//   }

//   async markAsRead(notificationId: string) {
//     const notification = await this.notificationRepo.findOneBy({
//       id: notificationId,
//     });
//     if (notification) {
//       notification.isRead = true;
//       return this.notificationRepo.save(notification);
//     }
//     return null;
//   }

//   async markAllAsRead(userId: string) {
//     const result = await this.notificationRepo.update(
//       { recipient: { id: userId }, isRead: false },
//       { isRead: true },
//     );

//     return result;
//   }

//   async getUnreadCount(userId: string): Promise<number> {
//     return await this.notificationRepo.count({
//       where: { recipient: { id: userId }, isRead: false },
//     });
//   }

//   // SSE Channel Management
//   getOrCreateChannel(tenantId: string): Subject<MessageEvent> {
//     if (!this.channels[tenantId]) {
//       this.channels[tenantId] = new Subject<MessageEvent>();
//     }
//     return this.channels[tenantId];
//   }

//   private emitToChannel(tenantId: string, event: MessageEvent) {
//     if (this.channels[tenantId]) {
//       this.channels[tenantId].next(event);
//     }
//   }

//   // Clean up channels when no longer needed
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
import { Subject } from 'rxjs';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from './dtos/notification.dto';
import { User } from '../entities/user.entity';
import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
import { MessageEvent } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly notificationRepo: Repository<Notification>;
  private channels: Record<string, Subject<MessageEvent>> = {};

  constructor(@Inject(CONNECTION) private readonly connection: DataSource) {
    this.notificationRepo = this.connection.getRepository(Notification);
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    try {
      const notificationData: Partial<Notification> = {
        message: dto.message,
        type: dto.type,
        recipient: dto.recipientId ? ({ id: dto.recipientId } as User) : null,
        triggeredBy: dto.triggeredBy ? ({ id: dto.triggeredBy } as User) : null,
      };

      const notification = this.notificationRepo.create(notificationData);
      const saved = await this.notificationRepo.save(notification);

      const tenantId = this.connection.options.database as string;
      this.emitToChannel(tenantId, {
        data: saved,
        type: 'notification',
        id: saved.id,
      });

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

  async findForUser(userId: string): Promise<Notification[]> {
    try {
      return await this.notificationRepo.find({
        where: [{ recipient: { id: userId } }, { recipient: IsNull() }],
        order: { created_at: 'DESC' },
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
      { recipient: { id: userId }, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { recipient: { id: userId }, isRead: false },
    });
  }

  // --- SSE Channel Management ---
  getOrCreateChannel(tenantId: string): Subject<MessageEvent> {
    if (!this.channels[tenantId]) {
      this.channels[tenantId] = new Subject<MessageEvent>();
    }
    return this.channels[tenantId];
  }

  private emitToChannel(tenantId: string, event: MessageEvent) {
    if (this.channels[tenantId]) {
      this.channels[tenantId].next(event);
    }
  }

  closeChannel(tenantId: string) {
    if (this.channels[tenantId]) {
      this.channels[tenantId].complete();
      delete this.channels[tenantId];
    }
  }
}
