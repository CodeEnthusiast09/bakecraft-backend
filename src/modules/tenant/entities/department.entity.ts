import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'departments' })
export class Department extends AbstractEntity {
  @Column({ unique: true })
  name: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;
}
