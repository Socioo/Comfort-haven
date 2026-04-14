import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import * as dns from 'dns';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    // Force IPv4 as the default for all DNS lookups in this process
    if (dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv4first');
    }
  }

  private async ensureTransporter() {
    if (this.transporter) return;

    const host = this.configService.get('MAIL_HOST') || 'smtp.gmail.com';
    const user = this.configService.get('MAIL_USER');
    const pass = this.configService.get('MAIL_PASS');
    const port = Number(this.configService.get('MAIL_PORT')) || 587;
    const secureConfig = this.configService.get('MAIL_SECURE');
    const secure = secureConfig === true || secureConfig === 'true' || port === 465;

    if (!user || !pass) {
      this.logger.warn('No SMTP credentials found in ENV. Creating a test account with Ethereal...');
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log('Test account created. Emails will be available for preview via Ethereal.');
    } else {
      this.logger.log(`Initializing SMTP: ${host}:${port} (Secure: ${secure}, Force IPv4)`);
      
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for 587
        auth: { user, pass },
        // Strictly enforce IPv4 at the socket level
        family: 4,
        dns: {
          // Additional DNS configuration if supported by the nodemailer version
          family: 4
        },
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 30000,
        socketTimeout: 30000,
      } as any);

      // Verify connection immediately
      this.transporter.verify((error) => {
        if (error) {
          this.logger.error(`SMTP Connection Check FAILED: ${error.message}`);
          if (error.message.includes('ENETUNREACH')) {
            this.logger.error('Network unreachable. This often happens if IPv6 is prioritized on a network that doesn\'t support it. Attempting to force IPv4.');
          }
          
          // If we fail, try to fall back to test account if in development
          if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
             this.logger.warn('Real SMTP failed. Falling back to Ethereal for dev preview...');
             this.transporter = undefined as any; 
          }
        } else {
          this.logger.log(`SUCCESS: SMTP Server (${host}) is connected and ready.`);
        }
      });
    }
  }

  async sendInvitationEmail(email: string, name: string, password: string, customMessage?: string) {
    await this.ensureTransporter();

    const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
    
    const mailOptions = {
      from: `"Comfort Haven" <${this.configService.get('MAIL_USER') || 'noreply@comfort-haven.com'}>`,
      to: email,
      subject: 'Welcome to Comfort Haven - Your Admin Invitation',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #4a90e2; padding: 30px; text-align: center;">
            <img src="cid:logo" alt="Comfort Haven Logo" style="width: 80px; height: 80px; margin-bottom: 10px; border-radius: 15px;" />
            <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Comfort Haven</h1>
          </div>
          <div style="padding: 40px; color: #333;">
            <h2 style="color: #4a90e2; margin-top: 0;">Hello, ${name}!</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              ${customMessage || 'You have been invited to join the Comfort Haven administration team. We are excited to have you on board!'}
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #666; font-size: 14px; text-transform: uppercase;">Login Credentials</p>
              <div style="display: flex; margin-bottom: 10px;">
                <span style="color: #888; width: 80px;">Email:</span>
                <span style="font-family: monospace; font-weight: bold;">${email}</span>
              </div>
              <div style="display: flex;">
                <span style="color: #888; width: 80px;">Password:</span>
                <span style="font-family: monospace; font-weight: bold;">${password}</span>
              </div>
            </div>

            <p style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 6px; border-left: 4px solid #ffeeba; font-size: 14px;">
              <strong>Security Tip:</strong> You will be required to change this temporary password immediately after your first login.
            </p>

            <div style="text-align: center; margin-top: 40px;">
              <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}" 
                 style="background-color: #4a90e2; color: white; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                 Go to Admin Dashboard
              </a>
            </div>
          </div>
          <div style="background-color: #f1f1f1; padding: 20px; text-align: center; color: #888; font-size: 12px;">
            <p>&copy; 2026 Comfort Haven Project. All rights reserved.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'icon.png',
          path: logoPath,
          cid: 'logo'
        }
      ]
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Invitation email sent: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}: ${error.message}`);
    }
  }

  async sendResetPasswordEmail(email: string, name: string, otp: string) {
    await this.ensureTransporter();

    const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
    
    const mailOptions = {
      from: `"Comfort Haven" <${this.configService.get('MAIL_USER') || 'noreply@comfort-haven.com'}>`,
      to: email,
      subject: 'Password Reset Code - Comfort Haven',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #2F95DC; padding: 30px; text-align: center;">
            <img src="cid:logo" alt="Comfort Haven Logo" style="width: 80px; height: 80px; margin-bottom: 10px; border-radius: 15px;" />
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
      `,
      attachments: [
        {
          filename: 'icon.png',
          path: logoPath,
          cid: 'logo'
        }
      ]
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Reset password email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send reset password email to ${email}: ${error.message}`);
    }
  }
}
