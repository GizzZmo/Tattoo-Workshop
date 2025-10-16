import nodemailer from 'nodemailer';

/**
 * Email service for sending appointment notifications
 */
class EmailService {
  constructor(db) {
    this.db = db;
    this.transporter = null;
  }

  /**
   * Initialize email transporter with current settings
   */
  async initializeTransporter() {
    try {
      const config = this.getEmailConfig();
      
      if (!config.enabled || !config.smtp_host) {
        return false;
      }

      this.transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port || 587,
        secure: config.smtp_secure === 'true',
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      return false;
    }
  }

  /**
   * Get email configuration from database
   */
  getEmailConfig() {
    const config = {};
    const stmt = this.db.prepare('SELECT key, value FROM settings WHERE key LIKE ?');
    const results = stmt.all('email_%');

    results.forEach(row => {
      const key = row.key.replace('email_', '');
      config[key] = row.value;
    });

    return config;
  }

  /**
   * Get email template from database
   */
  getTemplate(templateName) {
    const stmt = this.db.prepare('SELECT * FROM email_templates WHERE name = ?');
    return stmt.get(templateName);
  }

  /**
   * Replace template variables with actual values
   */
  processTemplate(template, variables) {
    let processed = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });
    return processed;
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(appointment, customer) {
    try {
      const config = this.getEmailConfig();
      if (!config.enabled || config.enabled !== 'true') {
        console.log('Email notifications disabled');
        return { success: false, message: 'Email notifications disabled' };
      }

      await this.initializeTransporter();
      if (!this.transporter) {
        return { success: false, message: 'Email not configured' };
      }

      const template = this.getTemplate('appointment_confirmation');
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      const appointmentDate = new Date(appointment.appointment_date);
      const variables = {
        customer_name: customer.name,
        appointment_date: appointmentDate.toLocaleDateString(),
        appointment_time: appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        artist_name: appointment.artist_name,
        duration: appointment.duration,
        notes: appointment.notes || 'None',
      };

      const subject = this.processTemplate(template.subject, variables);
      const body = this.processTemplate(template.body, variables);

      await this.transporter.sendMail({
        from: `"${config.from_name || 'Tattoo Workshop'}" <${config.from_address}>`,
        to: customer.email,
        subject,
        html: body,
      });

      // Log the notification
      this.logNotification({
        customer_id: customer.id,
        appointment_id: appointment.id,
        type: 'confirmation',
        recipient: customer.email,
        status: 'sent',
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(appointment, customer, reminderType = '24h') {
    try {
      const config = this.getEmailConfig();
      if (!config.enabled || config.enabled !== 'true' || !config.reminders_enabled || config.reminders_enabled !== 'true') {
        return { success: false, message: 'Reminders disabled' };
      }

      await this.initializeTransporter();
      if (!this.transporter) {
        return { success: false, message: 'Email not configured' };
      }

      const template = this.getTemplate('appointment_reminder');
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      const appointmentDate = new Date(appointment.appointment_date);
      const reminderText = reminderType === '24h' ? '24 hours' : '1 week';
      
      const variables = {
        customer_name: customer.name,
        appointment_date: appointmentDate.toLocaleDateString(),
        appointment_time: appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        artist_name: appointment.artist_name,
        duration: appointment.duration,
        reminder_period: reminderText,
      };

      const subject = this.processTemplate(template.subject, variables);
      const body = this.processTemplate(template.body, variables);

      await this.transporter.sendMail({
        from: `"${config.from_name || 'Tattoo Workshop'}" <${config.from_address}>`,
        to: customer.email,
        subject,
        html: body,
      });

      this.logNotification({
        customer_id: customer.id,
        appointment_id: appointment.id,
        type: `reminder_${reminderType}`,
        recipient: customer.email,
        status: 'sent',
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(appointment, customer) {
    try {
      const config = this.getEmailConfig();
      if (!config.enabled || config.enabled !== 'true') {
        return { success: false, message: 'Email notifications disabled' };
      }

      await this.initializeTransporter();
      if (!this.transporter) {
        return { success: false, message: 'Email not configured' };
      }

      const template = this.getTemplate('appointment_cancellation');
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      const appointmentDate = new Date(appointment.appointment_date);
      const variables = {
        customer_name: customer.name,
        appointment_date: appointmentDate.toLocaleDateString(),
        appointment_time: appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        artist_name: appointment.artist_name,
      };

      const subject = this.processTemplate(template.subject, variables);
      const body = this.processTemplate(template.body, variables);

      await this.transporter.sendMail({
        from: `"${config.from_name || 'Tattoo Workshop'}" <${config.from_address}>`,
        to: customer.email,
        subject,
        html: body,
      });

      this.logNotification({
        customer_id: customer.id,
        appointment_id: appointment.id,
        type: 'cancellation',
        recipient: customer.email,
        status: 'sent',
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send rescheduling notification
   */
  async sendReschedulingNotification(appointment, customer, oldDate) {
    try {
      const config = this.getEmailConfig();
      if (!config.enabled || config.enabled !== 'true') {
        return { success: false, message: 'Email notifications disabled' };
      }

      await this.initializeTransporter();
      if (!this.transporter) {
        return { success: false, message: 'Email not configured' };
      }

      const template = this.getTemplate('appointment_rescheduled');
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      const newDate = new Date(appointment.appointment_date);
      const oldDateObj = new Date(oldDate);
      
      const variables = {
        customer_name: customer.name,
        old_appointment_date: oldDateObj.toLocaleDateString(),
        old_appointment_time: oldDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        new_appointment_date: newDate.toLocaleDateString(),
        new_appointment_time: newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        artist_name: appointment.artist_name,
      };

      const subject = this.processTemplate(template.subject, variables);
      const body = this.processTemplate(template.body, variables);

      await this.transporter.sendMail({
        from: `"${config.from_name || 'Tattoo Workshop'}" <${config.from_address}>`,
        to: customer.email,
        subject,
        html: body,
      });

      this.logNotification({
        customer_id: customer.id,
        appointment_id: appointment.id,
        type: 'rescheduled',
        recipient: customer.email,
        status: 'sent',
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send rescheduling email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Log email notification in database
   */
  logNotification(data) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO email_notifications 
        (customer_id, appointment_id, type, recipient, status, sent_at) 
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(
        data.customer_id,
        data.appointment_id,
        data.type,
        data.recipient,
        data.status
      );
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail) {
    try {
      await this.initializeTransporter();
      if (!this.transporter) {
        return { success: false, message: 'Email not configured' };
      }

      const config = this.getEmailConfig();
      await this.transporter.sendMail({
        from: `"${config.from_name || 'Tattoo Workshop'}" <${config.from_address}>`,
        to: toEmail,
        subject: 'Test Email - Tattoo Workshop',
        html: '<h2>Email Configuration Test</h2><p>This is a test email from Tattoo Workshop. Your email settings are working correctly!</p>',
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send test email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get pending reminders that need to be sent
   */
  getPendingReminders() {
    const now = new Date();
    const oneDayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneWeekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stmt = this.db.prepare(`
      SELECT a.*, c.name as customer_name, c.email as customer_email
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      WHERE a.status = 'scheduled'
      AND a.appointment_date BETWEEN ? AND ?
      AND NOT EXISTS (
        SELECT 1 FROM email_notifications en
        WHERE en.appointment_id = a.id
        AND en.type = ?
        AND en.status = 'sent'
      )
    `);

    // Get appointments needing 24h reminder
    const reminder24h = stmt.all(
      now.toISOString(),
      oneDayAhead.toISOString(),
      'reminder_24h'
    );

    // Get appointments needing 1 week reminder
    const reminder1week = stmt.all(
      oneDayAhead.toISOString(),
      oneWeekAhead.toISOString(),
      'reminder_1week'
    );

    return {
      reminder24h,
      reminder1week,
    };
  }
}

export default EmailService;
