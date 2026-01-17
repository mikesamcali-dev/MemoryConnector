import { Module } from '@nestjs/common';
import { UserMemoryController } from './user-memory.controller';
import { UserMemoryService } from './user-memory.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserMemoryController],
  providers: [UserMemoryService],
  exports: [UserMemoryService],
})
export class UserMemoryModule {}
