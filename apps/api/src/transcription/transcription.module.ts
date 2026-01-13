import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { UsageModule } from '../modules/usage/usage.module';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { WhisperService } from './whisper.service';
import { LexiconService } from './lexicon.service';
import { ClaudeCleanupService } from './claude-cleanup.service';
import { TranscriptionGateway } from './transcription.gateway';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    UsageModule,
  ],
  controllers: [TranscriptionController],
  providers: [
    TranscriptionService,
    WhisperService,
    LexiconService,
    ClaudeCleanupService,
    TranscriptionGateway,
    WsJwtAuthGuard,
    CleanupService,
  ],
  exports: [TranscriptionService, LexiconService],
})
export class TranscriptionModule {}
