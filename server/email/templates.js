/**
 * Default email templates for appointment notifications
 */
export const defaultTemplates = [
  {
    name: 'appointment_confirmation',
    subject: 'Appointment Confirmation - {{appointment_date}}',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4a5568; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f7fafc; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4a5568; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed</h1>
          </div>
          <div class="content">
            <p>Dear {{customer_name}},</p>
            <p>Your tattoo appointment has been confirmed!</p>
            <div class="details">
              <strong>Appointment Details:</strong><br>
              Date: {{appointment_date}}<br>
              Time: {{appointment_time}}<br>
              Artist: {{artist_name}}<br>
              Duration: {{duration}} minutes<br>
              Notes: {{notes}}
            </div>
            <p>We look forward to seeing you! If you need to make any changes, please contact us as soon as possible.</p>
            <p>Best regards,<br>Tattoo Workshop Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Sent when a new appointment is created',
  },
  {
    name: 'appointment_reminder',
    subject: 'Reminder: Appointment in {{reminder_period}}',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4299e1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f7fafc; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4299e1; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Reminder</h1>
          </div>
          <div class="content">
            <p>Dear {{customer_name}},</p>
            <p>This is a friendly reminder that your tattoo appointment is coming up in {{reminder_period}}.</p>
            <div class="details">
              <strong>Appointment Details:</strong><br>
              Date: {{appointment_date}}<br>
              Time: {{appointment_time}}<br>
              Artist: {{artist_name}}<br>
              Duration: {{duration}} minutes
            </div>
            <p>Please arrive 10 minutes early. If you need to cancel or reschedule, please contact us as soon as possible.</p>
            <p>Best regards,<br>Tattoo Workshop Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Sent as a reminder before appointments',
  },
  {
    name: 'appointment_cancellation',
    subject: 'Appointment Cancelled - {{appointment_date}}',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f56565; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f7fafc; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f56565; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Cancelled</h1>
          </div>
          <div class="content">
            <p>Dear {{customer_name}},</p>
            <p>Your appointment has been cancelled.</p>
            <div class="details">
              <strong>Cancelled Appointment:</strong><br>
              Date: {{appointment_date}}<br>
              Time: {{appointment_time}}<br>
              Artist: {{artist_name}}
            </div>
            <p>If you would like to reschedule, please contact us. We hope to see you soon!</p>
            <p>Best regards,<br>Tattoo Workshop Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Sent when an appointment is cancelled',
  },
  {
    name: 'appointment_rescheduled',
    subject: 'Appointment Rescheduled - New Date: {{new_appointment_date}}',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ed8936; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f7fafc; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ed8936; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Rescheduled</h1>
          </div>
          <div class="content">
            <p>Dear {{customer_name}},</p>
            <p>Your appointment has been rescheduled to a new date and time.</p>
            <div class="details">
              <strong>Previous Appointment:</strong><br>
              Date: {{old_appointment_date}}<br>
              Time: {{old_appointment_time}}<br><br>
              <strong>New Appointment:</strong><br>
              Date: {{new_appointment_date}}<br>
              Time: {{new_appointment_time}}<br>
              Artist: {{artist_name}}
            </div>
            <p>We look forward to seeing you at the new time! If you have any questions, please contact us.</p>
            <p>Best regards,<br>Tattoo Workshop Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Sent when an appointment is rescheduled',
  },
];

/**
 * Initialize email templates in the database
 */
export function initializeTemplates(db) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO email_templates (name, subject, body, description)
    VALUES (?, ?, ?, ?)
  `);

  defaultTemplates.forEach(template => {
    stmt.run(template.name, template.subject, template.body, template.description);
  });

  console.log('Email templates initialized');
}
