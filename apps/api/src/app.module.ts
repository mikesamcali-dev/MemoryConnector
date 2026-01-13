import { UsageModule } from './modules/usage/usage.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MemoriesModule } from './memories/memories.module';
import { SearchModule } from './search/search.module';
import { RemindersModule } from './reminders/reminders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { GamificationModule } from './gamification/gamification.module';
import { SlideDecksModule } from './slidedecks/slidedecks.module';
import { WordsModule } from './words/words.module';
import { ProjectsModule } from './projects/projects.module';
import { TrainingsModule } from './trainings/trainings.module';
import { TrainingDecksModule } from './training-decks/training-decks.module';
import { EventsModule } from './events/events.module';
import { LocationsModule } from './locations/locations.module';
import { PeopleModule } from './people/people.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { YouTubeVideosModule } from './youtube-videos/youtube-videos.module';
import { TikTokVideosModule } from './tiktok-videos/tiktok-videos.module';
import { ImagesModule } from './images/images.module';
import { UrlPagesModule } from './url-pages/url-pages.module';
import { TranscriptionModule } from './transcription/transcription.module';
// Temporarily disabled - these modules need to be updated for hybrid schema
// import { MemoryRelationshipsModule } from './memory-relationships/memory-relationships.module';
// import { MemoryEntitiesModule } from './memory-entities/memory-entities.module';
import { SpellCheckModule } from './spell-check/spell-check.module';
import { AdminModule } from './admin/admin.module';
import { AuditTrailModule } from './audit-trail/audit-trail.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { RedisModule } from './redis/redis.module';
import { AiCircuitBreakerModule } from './ai-circuit-breaker/ai-circuit-breaker.module';
import { EnrichmentModule } from './enrichment/enrichment.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { AlertingModule } from './alerting/alerting.module';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TierBasedThrottlerGuard } from './common/guards/tier-based-throttler.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { IdempotencyInterceptor } from './idempotency/interceptors/idempotency.interceptor';
import { AuditLoggingInterceptor } from './audit-trail/interceptors/audit-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: 60000, // 1 minute in milliseconds
        limit: 100, // Default limit (overridden by TierBasedThrottlerGuard)
      }]),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RedisModule,
    AlertingModule,
    UsageModule,
    AiCircuitBreakerModule,
    EmbeddingsModule,
    EnrichmentModule,
    MemoriesModule,
    SearchModule,
    RemindersModule,
    ReviewsModule,
    GamificationModule,
    SlideDecksModule,
    WordsModule,
    ProjectsModule,
    TrainingsModule,
    TrainingDecksModule,
    EventsModule,
    LocationsModule,
    PeopleModule,
    UserPreferencesModule,
    YouTubeVideosModule,
    TikTokVideosModule,
    ImagesModule,
    UrlPagesModule,
    TranscriptionModule,
    // MemoryRelationshipsModule, // Disabled - needs update for hybrid schema
    // MemoryEntitiesModule, // Disabled - needs update for hybrid schema
    SpellCheckModule,
    AdminModule,
    AuditTrailModule,
    HealthModule,
    MetricsModule,
    IdempotencyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TierBasedThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggingInterceptor,
    },
  ],
})
export class AppModule {}

