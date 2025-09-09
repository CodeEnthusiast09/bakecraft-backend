import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'invites' })
export class Invite extends AbstractEntity {
  @Column()
  department: string;

  @Column()
  email: string;

  @Column()
  role: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invited_by_id' })
  invited_by?: User;
}
