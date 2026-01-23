import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

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

  async sendTwoFactorCode(email: string, code: string): Promise<void> {
    if (!this.resend) {
      this.logger.error('Resend is not initialized. Cannot send email.');
      throw new Error('Email service is not configured');
    }

    const fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'ondrej@losensky.dev';
    const fromName =
      this.configService.get<string>('RESEND_FROM_NAME') || 'Démonická';

    try {
      const result = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: 'Váš kód pro dvoufázové ověření',
        html: this.getTwoFactorCodeEmailTemplate(code),
      });

      // Resend returns { data: { id: string } } on success or throws on error
      if (result.data?.id) {
        this.logger.log('2FA code sent successfully');
      } else {
        this.logger.warn('Resend response missing ID');
      }
    } catch (error: any) {
      this.logger.error('Failed to send 2FA code:', {
        message: error?.message,
        name: error?.name,
        status: error?.response?.status,
      });
      
      // Provide more helpful error messages
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          let errorMessage = `Failed to send email: ${errorData.message}`;
          // Add helpful hints for common issues
          if (errorData.message.includes('domain') || errorData.message.includes('verify')) {
            errorMessage += ' Make sure your domain is verified in Resend dashboard.';
          }
          throw new Error(errorMessage);
        }
      }
      
      // Check for common error patterns
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('domain') || errorMessage.includes('verify')) {
        throw new Error(`Failed to send email: ${errorMessage}. Make sure your domain (${fromEmail.split('@')[1]}) is verified in Resend dashboard.`);
      }
      
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }

  private getTwoFactorCodeEmailTemplate(code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kód pro dvoufázové ověření</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Démonická</h1>
  </div>
  
  <div style="background-color: #fff; padding: 30px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2c3e50; margin-top: 0;">Kód pro dvoufázové ověření</h2>
    
    <p>Váš kód pro přihlášení je:</p>
    
    <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; font-family: 'Courier New', monospace;">
        ${code}
      </span>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Tento kód je platný po dobu 10 minut. Pokud jste o tento kód nepožádali, ignorujte tento email.
    </p>
  </div>
  
  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
    <p>Démonická - Systém pro správu pivních akcí</p>
  </div>
</body>
</html>
    `.trim();
  }
}
