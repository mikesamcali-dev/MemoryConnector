import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendWelcomeEmail(email: string, temporaryPassword: string): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM');

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Welcome to Memory Connector - Your Account Details',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .credentials-box { background-color: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .credential-item { margin: 15px 0; }
              .credential-label { font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 5px; }
              .credential-value { font-family: 'Courier New', monospace; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 16px; color: #1f2937; }
              .important-note { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Welcome to Memory Connector!</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>Your Memory Connector account has been created by an administrator. Below are your login credentials:</p>

                <div class="credentials-box">
                  <div class="credential-item">
                    <div class="credential-label">EMAIL</div>
                    <div class="credential-value">${email}</div>
                  </div>
                  <div class="credential-item">
                    <div class="credential-label">TEMPORARY PASSWORD</div>
                    <div class="credential-value">${temporaryPassword}</div>
                  </div>
                </div>

                <div class="important-note">
                  <strong>⚠️ Important:</strong> When you first log in, you'll be required to change your password to something secure and memorable. After changing your password, you'll complete a brief questionnaire to personalize your memory experience.
                </div>

                <p>To get started:</p>
                <ol>
                  <li>Visit the Memory Connector login page</li>
                  <li>Enter your email and temporary password</li>
                  <li>Create a new secure password (minimum 8 characters)</li>
                  <li>Complete the onboarding questionnaire to customize your experience</li>
                </ol>

                <div style="text-align: center;">
                  <a href="https://memoryconnector.com/login" class="button">Log In Now</a>
                </div>

                <div class="footer">
                  <p>If you didn't expect this email or have any questions, please contact your administrator.</p>
                  <p>&copy; ${new Date().getFullYear()} Memory Connector. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Welcome to Memory Connector!

Your account has been created by an administrator.

Login Credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

IMPORTANT: When you first log in, you'll be required to change your password to something secure and memorable. After changing your password, you'll complete a brief questionnaire to personalize your memory experience.

To get started:
1. Visit https://memoryconnector.com/login
2. Enter your email and temporary password
3. Create a new secure password (minimum 8 characters)
4. Complete the onboarding questionnaire

If you didn't expect this email or have any questions, please contact your administrator.

© ${new Date().getFullYear()} Memory Connector. All rights reserved.
        `,
      });

      this.logger.log(`Welcome email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      throw new Error('Failed to send welcome email');
    }
  }
}
