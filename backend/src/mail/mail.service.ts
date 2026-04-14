import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('MailService initialized with Resend.');
    } else {
      this.logger.warn('RESEND_API_KEY not set. Emails will be logged to console only (dev mode).');
    }
  }

  private getFrom(): string {
    return this.configService.get<string>('MAIL_FROM') || 'Comfort Haven <onboarding@resend.dev>';
  }

  /** Send via Resend, with console fallback if no API key */
  private async send(options: { to: string; subject: string; html: string }) {
    if (!this.resend) {
      this.logger.warn(`[DEV EMAIL FALLBACK] Would send email to ${options.to}: "${options.subject}"`);
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.getFrom(),
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        this.logger.error(`Failed to send email to ${options.to}: ${JSON.stringify(error)}`);
        throw new Error(error.message);
      }

      this.logger.log(`Email sent successfully to ${options.to} (ID: ${data?.id})`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}: ${err.message}`);
      throw err;
    }
  }

  async sendInvitationEmail(email: string, name: string, password: string, customMessage?: string) {
    this.logger.log(`Sending invitation email to ${email}...`);

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4a90e2; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Comfort Haven</h1>
        </div>
        <div style="padding: 40px; color: #333;">
          <h2 style="color: #4a90e2; margin-top: 0;">Hello, ${name}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">
            ${customMessage || 'You have been invited to join the Comfort Haven administration team. We are excited to have you on board!'}
          </p>
          
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #666; font-size: 14px; text-transform: uppercase;">Login Credentials</p>
            <div style="margin-bottom: 10px;">
              <span style="color: #888; display: inline-block; width: 80px;">Email:</span>
              <span style="font-family: monospace; font-weight: bold;">${email}</span>
            </div>
            <div>
              <span style="color: #888; display: inline-block; width: 80px;">Password:</span>
              <span style="font-family: monospace; font-weight: bold;">${password}</span>
            </div>
          </div>

          <p style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 6px; border-left: 4px solid #ffeeba; font-size: 14px;">
            <strong>Security Tip:</strong> You will be required to change this temporary password immediately after your first login.
          </p>

          <div style="text-align: center; margin-top: 40px;">
            <a href="${this.configService.get('FRONTEND_URL') || 'https://comfort-haven-admin.web.app'}"
               style="background-color: #4a90e2; color: white; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
               Go to Admin Dashboard
            </a>
          </div>
        </div>
        <div style="background-color: #f1f1f1; padding: 20px; text-align: center; color: #888; font-size: 12px;">
          <p>&copy; 2026 Comfort Haven Project. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.send({
      to: email,
      subject: 'Welcome to Comfort Haven - Your Admin Invitation',
      html,
    });
  }

  async sendResetPasswordEmail(email: string, name: string, otp: string) {
    this.logger.log(`Sending password reset email to ${email}...`);

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #2F95DC; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
        </div>
        <div style="padding: 40px; color: #333;">
          <h2 style="color: #2F95DC; margin-top: 0;">Hello, ${name}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">
            We received a request to reset your password for your Comfort Haven account. Please use the verification code below to proceed:
          </p>
          
          <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 15px 0; font-weight: bold; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #2F95DC; font-family: monospace;">${otp}</div>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            This code will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
          </p>

          <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #999; text-align: center;">
            <p>For security, never share this code with anyone. Comfort Haven employees will never ask for your code.</p>
          </div>
        </div>
        <div style="background-color: #f1f1f1; padding: 20px; text-align: center; color: #888; font-size: 12px;">
          <p>&copy; 2026 Comfort Haven. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.send({
      to: email,
      subject: 'Password Reset Code - Comfort Haven',
      html,
    });
  }
}
