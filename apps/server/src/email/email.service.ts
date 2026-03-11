import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { twoFactorCodeTemplate } from './templates/two-factor-code';
import { passwordResetTemplate } from './templates/password-reset';
import { passwordChangedTemplate } from './templates/password-changed';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set. Email functionality will not work.',
      );
    } else {
      this.resend = new Resend(apiKey);
      this.logger.log('EmailService initialized with Resend');
    }
  }

  private getFrom(): { from: string } {
    const fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'ondrej@losensky.dev';
    const fromName =
      this.configService.get<string>('RESEND_FROM_NAME') || 'Démonická';
    return { from: `${fromName} <${fromEmail}>` };
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    logLabel: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.error('Resend is not initialized. Cannot send email.');
      throw new Error('Email service is not configured');
    }

    const { from } = this.getFrom();

    this.logger.log(`Sending email "${subject}" to ${to}`);
    try {
      const result = await this.resend.emails.send({
        from,
        to: [to],
        subject,
        html,
      });

      if (result.data?.id) {
        this.logger.log(`${logLabel} sent successfully`);
      } else {
        this.logger.warn('Resend response missing ID');
      }
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        name?: string;
        response?: { data?: { message?: string }; status?: number };
      };
      this.logger.error(`Failed to send ${logLabel}:`, {
        message: error?.message,
        name: error?.name,
        status: error?.response?.status,
      });

      if (error?.response?.data?.message) {
        const msg = error.response.data.message;
        let errorMessage = `Failed to send email: ${msg}`;
        if (msg.includes('domain') || msg.includes('verify')) {
          errorMessage +=
            ' Make sure your domain is verified in Resend dashboard.';
        }
        throw new Error(errorMessage);
      }

      const errorMessage =
        typeof error?.message === 'string' ? error.message : 'Unknown error';
      if (errorMessage.includes('domain') || errorMessage.includes('verify')) {
        const fromEmail =
          this.configService.get<string>('RESEND_FROM_EMAIL') ||
          'ondrej@losensky.dev';
        throw new Error(
          `Failed to send email: ${errorMessage}. Make sure your domain (${fromEmail.split('@')[1]}) is verified in Resend dashboard.`,
        );
      }

      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }

  async sendTwoFactorCode(email: string, code: string): Promise<void> {
    await this.sendEmail(
      email,
      twoFactorCodeTemplate.subject,
      twoFactorCodeTemplate.getBody(code),
      '2FA code',
    );
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password?email=${encodeURIComponent(email)}`;
    await this.sendEmail(
      email,
      passwordResetTemplate.subject,
      passwordResetTemplate.getBody(code, resetLink),
      'password reset code',
    );
  }

  async sendPasswordChangedConfirmation(email: string): Promise<void> {
    await this.sendEmail(
      email,
      passwordChangedTemplate.subject,
      passwordChangedTemplate.getBody(),
      'password changed confirmation',
    );
  }
}
