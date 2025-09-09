import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UsersController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { EmailService } from '../email/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService, EmailService],
  exports: [UsersService],
})
export class UsersModule {}
