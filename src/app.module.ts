import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { UniversityModule } from './university/university.module';
import { DomainModule } from './universityDomain/domain/domain.module';

@Module({
  imports: [AuthModule, UserModule, PrismaModule, UniversityModule, DomainModule],
})

export class AppModule {}
