import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { UniversityModule } from './university/university.module';
import { DomainModule } from './domain/domain.module';
import { CategoryModule } from './category/category.module';
import { ListingModule } from './listing/listing.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { FavoritesModule } from './favorites/favorites.module';
import { MessageModule } from './message/message.module';
import { ConversationModule } from './conversation/conversation.module';
import { ReportModule } from './report/report.module';
import { FilterModule } from './filter/filter.module';

@Module({
  imports: [AuthModule, UserModule, PrismaModule, UniversityModule, DomainModule, CategoryModule, ListingModule, ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]), CloudinaryModule, FavoritesModule, MessageModule, ConversationModule, ReportModule, FilterModule],
    providers: [
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard
      }
    ]
})

export class AppModule {}
