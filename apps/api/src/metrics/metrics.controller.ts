import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics() {
    // Placeholder for Prometheus metrics
    // In production, use prom-client or similar
    return '# Prometheus metrics endpoint\n# Add prom-client integration for full metrics';
  }
}

