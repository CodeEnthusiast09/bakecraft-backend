import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'notifications' })
export class Notification extends AbstractEntity {
  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'triggered_by_id' })
  triggeredBy: User | null;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  type: string;
}
