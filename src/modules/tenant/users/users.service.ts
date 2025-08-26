import { Inject, Injectable } from '@nestjs/common';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  private readonly userRepo: Repository<User>;

  constructor(
    @Inject(CONNECTION)
    private readonly connection: DataSource,
  ) {
    this.userRepo = this.connection.getRepository(User);
  }

  async create(signUpDto: SignUpDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    const user = this.userRepo.create({
      ...signUpDto,
      password: hashedPassword,
    });

    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }
}
