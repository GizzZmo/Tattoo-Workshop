# Email Notification System

This document describes the email notification system for the Tattoo Workshop application.

## Overview

The email notification system automatically sends emails to customers for appointment-related events including:
- Appointment confirmations
- Appointment reminders (24 hours and 1 week before)
- Cancellation notifications
- Rescheduling notifications

## Features

### ✅ Implemented Features

1. **Email Service Module** (`server/email/service.js`)
   - Manages email sending using Nodemailer
   - Handles template processing with variable replacement
   - Logs all email notifications to database
   - Supports multiple notification types

2. **Email Templates** (`server/email/templates.js`)
   - Pre-configured HTML email templates
   - Customizable subject and body
   - Variable placeholders (e.g., `{{customer_name}}`, `{{appointment_date}}`)
   - Four default templates:
     - `appointment_confirmation` - Sent when appointment is created
     - `appointment_reminder` - Sent 24h or 1 week before appointment
     - `appointment_cancellation` - Sent when appointment is cancelled
     - `appointment_rescheduled` - Sent when appointment date changes

3. **Email Scheduler** (`server/email/scheduler.js`)
   - Automatic reminder scheduling
   - Runs every hour to check for pending reminders
   - Prevents duplicate reminders using notification log

4. **Database Tables**
   - `email_templates` - Stores email templates
   - `email_notifications` - Logs all sent notifications
   - Email settings stored in existing `settings` table

5. **API Endpoints**
   - `GET /api/email/config` - Get email configuration (password excluded)
   - `POST /api/email/config` - Update email configuration
   - `POST /api/email/test` - Send test email
   - `GET /api/email/templates` - List all templates
   - `GET /api/email/templates/:name` - Get specific template
   - `PUT /api/email/templates/:name` - Update template
   - `GET /api/email/notifications` - View notification log

## Configuration

### SMTP Settings

Configure email settings through the API:

```bash
curl -X POST http://localhost:3001/api/email/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": "true",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": "587",
    "smtp_secure": "false",
    "smtp_user": "your-email@gmail.com",
    "smtp_password": "your-app-password",
    "from_address": "noreply@tattooworkshop.com",
    "from_name": "Tattoo Workshop",
    "reminders_enabled": "true"
  }'
```

### Configuration Options

| Setting | Description | Example |
|---------|-------------|---------|
| `enabled` | Enable/disable email notifications | `"true"` or `"false"` |
| `smtp_host` | SMTP server hostname | `"smtp.gmail.com"` |
| `smtp_port` | SMTP server port | `"587"` (TLS) or `"465"` (SSL) |
| `smtp_secure` | Use SSL/TLS | `"true"` for port 465, `"false"` for 587 |
| `smtp_user` | SMTP username | Your email address |
| `smtp_password` | SMTP password | App-specific password |
| `from_address` | Sender email address | `"noreply@tattooworkshop.com"` |
| `from_name` | Sender display name | `"Tattoo Workshop"` |
| `reminders_enabled` | Enable/disable automatic reminders | `"true"` or `"false"` |

### Email Provider Examples

#### Gmail
```json
{
  "smtp_host": "smtp.gmail.com",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "your-email@gmail.com",
  "smtp_password": "your-app-password"
}
```
**Note**: Use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

#### SendGrid
```json
{
  "smtp_host": "smtp.sendgrid.net",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "apikey",
  "smtp_password": "your-sendgrid-api-key"
}
```

#### Mailgun
```json
{
  "smtp_host": "smtp.mailgun.org",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "your-mailgun-username",
  "smtp_password": "your-mailgun-password"
}
```

#### Office 365
```json
{
  "smtp_host": "smtp.office365.com",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "your-email@office365.com",
  "smtp_password": "your-password"
}
```

## Email Templates

### Template Variables

Templates support the following variables:

**Appointment Confirmation & Reminder:**
- `{{customer_name}}` - Customer's name
- `{{appointment_date}}` - Appointment date
- `{{appointment_time}}` - Appointment time
- `{{artist_name}}` - Assigned artist name
- `{{duration}}` - Appointment duration in minutes
- `{{notes}}` - Appointment notes (confirmation only)
- `{{reminder_period}}` - "24 hours" or "1 week" (reminder only)

**Cancellation:**
- `{{customer_name}}` - Customer's name
- `{{appointment_date}}` - Cancelled appointment date
- `{{appointment_time}}` - Cancelled appointment time
- `{{artist_name}}` - Artist name

**Rescheduling:**
- `{{customer_name}}` - Customer's name
- `{{old_appointment_date}}` - Original appointment date
- `{{old_appointment_time}}` - Original appointment time
- `{{new_appointment_date}}` - New appointment date
- `{{new_appointment_time}}` - New appointment time
- `{{artist_name}}` - Artist name

### Customizing Templates

You can customize templates through the API:

```bash
curl -X PUT http://localhost:3001/api/email/templates/appointment_confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Your Tattoo Appointment is Confirmed!",
    "body": "<html>...</html>"
  }'
```

## How It Works

### Appointment Lifecycle

1. **Appointment Created**
   - API: `POST /api/appointments`
   - Email: Confirmation email sent immediately to customer
   - Log: Notification logged with type `confirmation`

2. **Appointment Updated**
   - API: `PUT /api/appointments/:id`
   - If cancelled: Cancellation email sent
   - If date changed: Rescheduling email sent
   - Log: Notification logged with appropriate type

3. **Automatic Reminders**
   - Scheduler runs every hour
   - Checks for appointments 24h away → sends `reminder_24h`
   - Checks for appointments 1 week away → sends `reminder_1week`
   - Prevents duplicates by checking notification log

### Scheduler Details

The email scheduler:
- Starts automatically when the server starts
- Runs every 60 minutes (configurable in `server/index.js`)
- Queries for upcoming scheduled appointments
- Sends reminders only if not previously sent
- Respects the `email_reminders_enabled` setting

## Testing

### Send Test Email

```bash
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### View Notification Log

```bash
curl http://localhost:3001/api/email/notifications
```

This returns the last 100 email notifications with customer information.

### Manual Testing Workflow

1. Configure SMTP settings via API
2. Send a test email to verify configuration
3. Create a test appointment
4. Check notification log to confirm email was sent
5. Update appointment (change date or cancel) to test other notifications

## Troubleshooting

### Emails Not Sending

1. **Check Configuration**
   ```bash
   curl http://localhost:3001/api/email/config
   ```
   Verify all settings are correct and `enabled: "true"`

2. **Check Server Logs**
   Look for error messages in the console output

3. **Test Email Configuration**
   ```bash
   curl -X POST http://localhost:3001/api/email/test \
     -H "Content-Type: application/json" \
     -d '{"email": "your-email@example.com"}'
   ```

4. **Common Issues**
   - Gmail: Must use App Password, not regular password
   - Port 465 requires `smtp_secure: "true"`
   - Port 587 requires `smtp_secure: "false"`
   - Some providers require explicit sender verification

### Reminders Not Sending

1. Verify `reminders_enabled` is set to `"true"`
2. Check that appointments are in `scheduled` status
3. Ensure the scheduler is running (check server startup logs)
4. Check notification log for duplicate entries

## Security Considerations

- SMTP password is stored in database but never returned by GET endpoint
- Email notifications run asynchronously to avoid blocking API requests
- Failed email sends are logged but don't prevent appointment operations
- No sensitive customer data beyond name and email in templates

## Future Enhancements

Potential improvements:
- ✅ Unsubscribe mechanism (not yet implemented)
- ✅ Email delivery tracking (basic logging implemented)
- Advanced template editor UI
- Email queue with retry logic
- Custom reminder timing (not just 24h and 1 week)
- Email analytics and reporting
- Support for attachments (e.g., appointment QR codes)
- Multi-language email templates

## Database Schema

### email_templates
```sql
CREATE TABLE email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### email_notifications
```sql
CREATE TABLE email_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  appointment_id INTEGER,
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
```

## API Reference

See [API.md](API.md) for complete API documentation (to be updated).

## Dependencies

- **nodemailer** - Email sending library
- **better-sqlite3** - Database for storing templates and logs

## Support

For issues or questions:
- Check this documentation
- Review server console logs
- Test configuration with test email endpoint
- Verify SMTP provider settings
