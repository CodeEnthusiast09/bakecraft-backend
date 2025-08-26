import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity } from 'typeorm';

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

  get full_name(): string {
    return `${this.first_name} ${this.last_name}`;
  }
}
