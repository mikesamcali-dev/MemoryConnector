import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from '../common/logger';

interface AlertOptions {
  channel: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: Record<string, any>;
}

@Injectable()
export class AlertingService {
  constructor(private config: ConfigService) {}

  async alertSlack(options: AlertOptions): Promise<void> {
    const slackToken = this.config.get<string>('SLACK_BOT_TOKEN');
    
    if (!slackToken) {
      // Log warning if Slack not configured
      logger.warn(
        {
          channel: options.channel,
          severity: options.severity,
          message: options.message,
        },
        'Slack alert (Slack not configured)'
      );
      return;
    }

    // In production, use @slack/web-api
    // For now, just log
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
    }[options.severity];

    logger.info(
      {
        channel: options.channel,
        severity: options.severity,
        message: options.message,
        details: options.details,
      },
      `${emoji} Slack alert: ${options.message}`
    );

    // TODO: Implement actual Slack API call when @slack/web-api is added
  }
}

