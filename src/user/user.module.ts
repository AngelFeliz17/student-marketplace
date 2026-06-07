import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailModule } from 'src/email/email.module';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [UserService, EmailService],
  controllers: [UserController]
})
export class UserModule {}
