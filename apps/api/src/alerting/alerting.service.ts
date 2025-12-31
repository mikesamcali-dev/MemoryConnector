import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from '../common/logger';

interface AlertOptions {
  channel: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: Record<string, any>;
}

interface EmailAlertOptions {
  severity: 'info' | 'warning' | 'critical';
  subject: string;
  message: string;
  details?: Record<string, any>;
}

@Injectable()
export class AlertingService {
  constructor(private config: ConfigService) {}

  async alertSlack(options: AlertOptions): Promise<void> {
    const slackToken = this.config.get<string>('SLACK_BOT_TOKEN');

    if (!slackToken) {
      // Fallback to email if Slack not configured
      await this.alertEmail({
        severity: options.severity,
        subject: `[${options.severity.toUpperCase()}] Memory Connector Alert`,
        message: options.message,
        details: options.details,
      });
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

  async alertEmail(options: EmailAlertOptions): Promise<void> {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpUser = this.config.get<string>('SMTP_USER');

    if (!adminEmail || !smtpHost) {
      // Log alert if email not configured
      const emoji = {
        info: 'ℹ️',
        warning: '⚠️',
        critical: '🚨',
      }[options.severity];

      logger.warn(
        {
          severity: options.severity,
          subject: options.subject,
          message: options.message,
          details: options.details,
        },
        `${emoji} Email alert (Email not configured): ${options.message}`
      );
      return;
    }

    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
    }[options.severity];

    // For now, log the alert
    // In production, integrate with nodemailer, SendGrid, or AWS SES
    logger.info(
      {
        to: adminEmail,
        severity: options.severity,
        subject: options.subject,
        message: options.message,
        details: options.details,
      },
      `${emoji} Email alert would be sent: ${options.message}`
    );

    // TODO: Implement actual email sending
    /*
    Example with nodemailer:

    import nodemailer from 'nodemailer';

    const transporter = nodemailer.createTransporter({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });

    await transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: adminEmail,
      subject: options.subject,
      html: `
        <h2>${emoji} ${options.subject}</h2>
        <p><strong>Severity:</strong> ${options.severity}</p>
        <p><strong>Message:</strong> ${options.message}</p>
        ${options.details ? `<pre>${JSON.stringify(options.details, null, 2)}</pre>` : ''}
      `,
    });
    */
  }

  /**
   * Send alert via the configured channel (Slack or Email)
   */
  async alert(
    severity: 'info' | 'warning' | 'critical',
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    // Try Slack first, falls back to email
    await this.alertSlack({
      channel: this.config.get<string>('SLACK_CHANNEL_ALERTS', '#alerts'),
      severity,
      message,
      details,
    });
  }
}

