# Backup Configuration Guide

## Overview
The enhanced backup service now provides multiple backup strategies:
1. **Local backups** (every hour)
2. **Email backups** (every hour with zipped database)
3. **Google Drive backups** (every hour with automatic upload)

## Environment Variables

### Required for Email Backups
```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # SMTP server host
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com    # Your email address
SMTP_PASS=your-app-password       # Your email password or app password

# Backup Email Recipient
BACKUP_EMAIL_TO=backup@example.com  # Where to send backup emails
```

### Required for Google Drive Backups
```bash
# Google Drive Service Account Credentials
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Google Drive Folder ID
GOOGLE_DRIVE_FOLDER_ID=1ABC...XYZ  # ID of the folder to upload backups to
```

## Setup Instructions

### 1. Email Backup Setup (Gmail Example)

#### Option A: App Password (Recommended)
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App passwords
3. Generate an app password for "Mail"
4. Use your email + app password in SMTP_PASS

#### Option B: Less Secure Apps (Not Recommended)
1. Enable "Less secure app access" in Google Account settings
2. Use your regular email password

### 2. Google Drive Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google Drive API:**
   - Go to APIs & Services → Library
   - Search for "Google Drive API" and enable it

3. **Create Service Account:**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "Service Account"
   - Fill in details and create

4. **Generate JSON Key:**
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key" → "JSON"
   - Download the JSON file

5. **Share Google Drive Folder:**
   - Create a folder in Google Drive for backups
   - Right-click → Share → Add your service account email
   - Give "Editor" permissions
   - Copy the folder ID from the URL

6. **Set Environment Variables:**
   - Copy the entire JSON content to `GOOGLE_DRIVE_CREDENTIALS`
   - Copy the folder ID to `GOOGLE_DRIVE_FOLDER_ID`

## Backup Schedule

- **Frequency:** Every hour automatically
- **Local Cleanup:** Old backups deleted after 6 hours
- **Email:** Zipped database sent to specified email
- **Google Drive:** Zipped database uploaded to specified folder

## Manual Backup Trigger

You can trigger a manual backup via the service:
```typescript
const result = await backupService.triggerManualBackup();
console.log(result.message);
```

## Backup Contents

Each backup includes:
- **Database file:** `database.sqlite` (zipped)
- **Metadata:** Event name, timestamp, file size
- **Format:** ZIP archive with compression level 9

## Troubleshooting

### Email Issues
- Check SMTP credentials
- Verify port settings (587 for TLS, 465 for SSL)
- Check firewall/network restrictions
- For Gmail: Ensure app password is used if 2FA is enabled

### Google Drive Issues
- Verify service account has access to the folder
- Check API quotas and limits
- Ensure credentials JSON is properly formatted
- Verify folder ID is correct

### General Issues
- Check application logs for detailed error messages
- Verify database file exists and is accessible
- Ensure backup directory has write permissions

## Security Notes

- **Never commit credentials to version control**
- **Use environment variables for all sensitive data**
- **Regularly rotate app passwords and service account keys**
- **Monitor backup logs for unauthorized access attempts**
- **Consider encrypting backups before sending to external services**
