import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertingModule } from '../alerting/alerting.module';

@Module({
  imports: [RedisModule, PrismaModule, AlertingModule],
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class AiCircuitBreakerModule {}

