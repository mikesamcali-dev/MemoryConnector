import { Module } from '@nestjs/common';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';

@Module({
  imports: [PrismaModule, UserPreferencesModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}

