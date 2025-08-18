import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../events/events.service';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import * as archiver from 'archiver';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'data', 'backups');
  private transporter: nodemailer.Transporter;
  private driveClient: any;

  constructor(private readonly eventsService: EventsService) {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Initialize email transporter
    this.initializeEmailTransporter();
    
    // Initialize Google Drive client
    this.initializeGoogleDrive();
  }

  private initializeEmailTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.logger.log('Email transporter initialized');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
    }
  }

  private initializeGoogleDrive() {
    try {
      if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
        const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        
        this.driveClient = google.drive({ version: 'v3', auth });
        this.logger.log('Google Drive client initialized');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive client:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleBackup() {
    try {
      const activeEvent = await this.eventsService.getActiveEvent();

      if (!activeEvent) {
        this.logger.debug('No active event found, skipping backup');
        return;
      }

      // Create zipped backup
      const backupPath = await this.createZippedBackup();
      
      if (backupPath) {
        // Send email backup
        await this.sendEmailBackup(backupPath);
        
        // Upload to Google Drive
        await this.uploadToGoogleDrive(backupPath);
        
        // Clean up local backup file
        fs.unlinkSync(backupPath);
        this.logger.log('Backup cleanup completed');
      }

      // Clean up old backups
      this.cleanupOldBackups();
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
    }
  }

  private async createZippedBackup(): Promise<string | null> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup-${timestamp}.zip`);
      const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'database.sqlite');

      if (!fs.existsSync(dbPath)) {
        this.logger.error('Database file not found:', dbPath);
        return null;
      }

      return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(backupPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          this.logger.log(`Zipped backup created: ${backupPath} (${archive.pointer()} bytes)`);
          resolve(backupPath);
        });

        archive.on('error', (err) => {
          reject(err);
        });

        archive.pipe(output);
        archive.file(dbPath, { name: 'database.sqlite' });
        archive.finalize();
      });
    } catch (error) {
      this.logger.error('Failed to create zipped backup:', error);
      return null;
    }
  }

  private async sendEmailBackup(backupPath: string): Promise<void> {
    if (!this.transporter || !process.env.BACKUP_EMAIL_TO) {
      this.logger.debug('Email backup skipped - transporter or email not configured');
      return;
    }

    try {
      const timestamp = new Date().toLocaleString('cs-CZ');
      const eventName = (await this.eventsService.getActiveEvent())?.name || 'Unknown Event';
      
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.BACKUP_EMAIL_TO,
        subject: `🔄 Démonická Backup - ${eventName} - ${timestamp}`,
        html: `
          <h2>🔄 Démonická Database Backup</h2>
          <p><strong>Event:</strong> ${eventName}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p><strong>Backup Size:</strong> ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB</p>
          <p>This is an automated backup of your Démonická database. The backup is attached as a ZIP file.</p>
          <hr>
          <p><em>Generated automatically by Démonická Backup Service</em></p>
        `,
        attachments: [
          {
            filename: path.basename(backupPath),
            path: backupPath,
          },
        ],
      });

      this.logger.log('Email backup sent successfully');
    } catch (error) {
      this.logger.error('Failed to send email backup:', error);
    }
  }

  private async uploadToGoogleDrive(backupPath: string): Promise<void> {
    if (!this.driveClient || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      this.logger.debug('Google Drive backup skipped - client or folder not configured');
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const eventName = (await this.eventsService.getActiveEvent())?.name || 'Unknown Event';
      const fileName = `demonicka-backup-${eventName}-${timestamp}.zip`;

      const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        description: `Démonická Database Backup - ${eventName} - ${timestamp}`,
      };

      const media = {
        mimeType: 'application/zip',
        body: fs.createReadStream(backupPath),
      };

      const file = await this.driveClient.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
      });

      this.logger.log(`Google Drive backup uploaded: ${file.data.id}`);
    } catch (error) {
      this.logger.error('Failed to upload to Google Drive:', error);
    }
  }

  private cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = new Date().getTime();
      const sixHoursInMs = 6 * 60 * 60 * 1000;

      files.forEach((file) => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > sixHoursInMs) {
          fs.unlinkSync(filePath);
          this.logger.debug(`Deleted old backup: ${file}`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to cleanup old backups:', error);
    }
  }

  // Manual backup trigger
  async triggerManualBackup(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Manual backup triggered');
      await this.handleBackup();
      return { success: true, message: 'Manual backup completed successfully' };
    } catch (error) {
      this.logger.error('Manual backup failed:', error);
      return { success: false, message: `Manual backup failed: ${error.message}` };
    }
  }
}
