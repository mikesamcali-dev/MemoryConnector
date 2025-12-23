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
import { AdminModule } from './admin/admin.module';
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
    AdminModule,
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
  ],
})
export class AppModule {}

