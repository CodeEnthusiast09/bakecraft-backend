import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'roles' })
export class Role extends AbstractEntity {
  @Column({ unique: true })
  name: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;
}
