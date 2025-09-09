import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Department } from './department.entity';
import { Role } from './role.entity';

@Entity({ name: 'users' })
export class User extends AbstractEntity {
  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone_number: string;

  @Column()
  password: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => User, (user) => user.invited_users, { nullable: true })
  @JoinColumn({ name: 'invited_by_id' })
  invited_by?: User;

  @OneToMany(() => User, (user) => user.invited_by, { nullable: true })
  invited_users: User[];

  get full_name(): string {
    return `${this.first_name} ${this.last_name}`;
  }
}
