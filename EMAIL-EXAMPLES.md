# Email Notification System - Quick Start Examples

This file provides practical examples for using the email notification system.

## Example 1: Configure Email with Gmail

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
    "from_address": "your-email@gmail.com",
    "from_name": "Tattoo Workshop Studio",
    "reminders_enabled": "true"
  }'
```

**Important for Gmail:**
- You must create an [App Password](https://support.google.com/accounts/answer/185833)
- Regular Gmail password won't work
- Enable 2-factor authentication first

## Example 2: Send a Test Email

```bash
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

Expected response:
```json
{"success": true}
```

## Example 3: Create an Appointment (Triggers Confirmation Email)

First, create a customer:
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "555-1234",
    "address": "123 Main St",
    "notes": "First time customer"
  }'
```

Then create an appointment (this automatically sends a confirmation email):
```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "artist_name": "Mike Smith",
    "appointment_date": "2025-10-20T14:00:00",
    "duration": 120,
    "notes": "Sleeve design consultation"
  }'
```

## Example 4: Update Appointment (Triggers Rescheduling Email)

```bash
curl -X PUT http://localhost:3001/api/appointments/1 \
  -H "Content-Type: application/json" \
  -d '{
    "artist_name": "Mike Smith",
    "appointment_date": "2025-10-25T15:00:00",
    "duration": 120,
    "status": "scheduled",
    "notes": "Sleeve design consultation - rescheduled"
  }'
```

This will send a rescheduling email showing both old and new dates.

## Example 5: Cancel Appointment (Triggers Cancellation Email)

```bash
curl -X PUT http://localhost:3001/api/appointments/1 \
  -H "Content-Type: application/json" \
  -d '{
    "artist_name": "Mike Smith",
    "appointment_date": "2025-10-25T15:00:00",
    "duration": 120,
    "status": "cancelled",
    "notes": "Customer request"
  }'
```

## Example 6: View Email Notification Log

```bash
curl http://localhost:3001/api/email/notifications | jq '.'
```

This shows all sent emails with:
- Customer information
- Email type (confirmation, reminder_24h, reminder_1week, cancellation, rescheduled)
- Recipient email
- Status (sent)
- Timestamp

## Example 7: Customize Email Template

Get current template:
```bash
curl http://localhost:3001/api/email/templates/appointment_confirmation | jq '.'
```

Update template:
```bash
curl -X PUT http://localhost:3001/api/email/templates/appointment_confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Your Tattoo Appointment is Confirmed! 🎨",
    "body": "<!DOCTYPE html><html>...custom HTML...</html>"
  }'
```

## Example 8: Using SendGrid

```bash
curl -X POST http://localhost:3001/api/email/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": "true",
    "smtp_host": "smtp.sendgrid.net",
    "smtp_port": "587",
    "smtp_secure": "false",
    "smtp_user": "apikey",
    "smtp_password": "SG.your-sendgrid-api-key",
    "from_address": "noreply@yourdomain.com",
    "from_name": "Tattoo Workshop",
    "reminders_enabled": "true"
  }'
```

## Example 9: Disable Email Notifications Temporarily

```bash
curl -X POST http://localhost:3001/api/email/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": "false",
    "reminders_enabled": "false"
  }'
```

## Example 10: Check Current Configuration

```bash
curl http://localhost:3001/api/email/config | jq '.'
```

Note: Password is never returned for security.

## Testing Complete Workflow

Here's a complete test workflow:

```bash
#!/bin/bash

# 1. Configure email
curl -X POST http://localhost:3001/api/email/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": "true",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": "587",
    "smtp_secure": "false",
    "smtp_user": "your-email@gmail.com",
    "smtp_password": "your-app-password",
    "from_address": "your-email@gmail.com",
    "from_name": "Test Studio",
    "reminders_enabled": "true"
  }'

# 2. Test email
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'

# 3. Create customer
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "your-email@gmail.com",
    "phone": "555-0000"
  }'

# 4. Create appointment (sends confirmation)
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "artist_name": "Test Artist",
    "appointment_date": "2025-10-20T14:00:00",
    "duration": 60,
    "notes": "Test appointment"
  }'

# 5. Check notification log
curl http://localhost:3001/api/email/notifications
```

## Troubleshooting Examples

### Check if emails are being sent

```bash
# View notification log
curl http://localhost:3001/api/email/notifications | jq '.[] | {type: .type, recipient: .recipient, status: .status, sent_at: .sent_at}'
```

### Verify configuration

```bash
# Get current config
curl http://localhost:3001/api/email/config | jq '.'

# Check specific setting
curl http://localhost:3001/api/email/config | jq '.enabled'
```

### Test with a specific email

```bash
# Send to specific address
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Email Template Variables Reference

Use these variables in your custom templates:

**For confirmations:**
- `{{customer_name}}`
- `{{appointment_date}}`
- `{{appointment_time}}`
- `{{artist_name}}`
- `{{duration}}`
- `{{notes}}`

**For reminders:**
- Same as confirmations, plus:
- `{{reminder_period}}` - "24 hours" or "1 week"

**For rescheduling:**
- `{{customer_name}}`
- `{{old_appointment_date}}`
- `{{old_appointment_time}}`
- `{{new_appointment_date}}`
- `{{new_appointment_time}}`
- `{{artist_name}}`

**For cancellations:**
- `{{customer_name}}`
- `{{appointment_date}}`
- `{{appointment_time}}`
- `{{artist_name}}`
