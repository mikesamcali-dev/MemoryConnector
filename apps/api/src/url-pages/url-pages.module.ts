import { Module } from '@nestjs/common';
import { UrlPagesController } from './url-pages.controller';
import { UrlPagesService } from './url-pages.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UrlPagesController],
  providers: [UrlPagesService],
  exports: [UrlPagesService],
})
export class UrlPagesModule {}
