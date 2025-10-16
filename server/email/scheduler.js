import EmailService from './service.js';

/**
 * Email scheduler for sending appointment reminders
 */
class EmailScheduler {
  constructor(db) {
    this.db = db;
    this.emailService = new EmailService(db);
    this.intervalId = null;
  }

  /**
   * Start the scheduler
   */
  start(intervalMinutes = 60) {
    if (this.intervalId) {
      console.log('Email scheduler already running');
      return;
    }

    console.log(`Starting email scheduler (checking every ${intervalMinutes} minutes)`);
    
    // Run immediately on start
    this.processReminders();

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Email scheduler stopped');
    }
  }

  /**
   * Process pending reminders
   */
  async processReminders() {
    try {
      console.log('Checking for pending reminders...');
      const { reminder24h, reminder1week } = this.emailService.getPendingReminders();

      // Send 24-hour reminders
      for (const appointment of reminder24h) {
        const customer = {
          id: appointment.customer_id,
          name: appointment.customer_name,
          email: appointment.customer_email,
        };
        
        console.log(`Sending 24h reminder for appointment ${appointment.id} to ${customer.email}`);
        await this.emailService.sendAppointmentReminder(appointment, customer, '24h');
      }

      // Send 1-week reminders
      for (const appointment of reminder1week) {
        const customer = {
          id: appointment.customer_id,
          name: appointment.customer_name,
          email: appointment.customer_email,
        };
        
        console.log(`Sending 1-week reminder for appointment ${appointment.id} to ${customer.email}`);
        await this.emailService.sendAppointmentReminder(appointment, customer, '1week');
      }

      if (reminder24h.length > 0 || reminder1week.length > 0) {
        console.log(`Sent ${reminder24h.length} 24h reminders and ${reminder1week.length} 1-week reminders`);
      }
    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  }
}

export default EmailScheduler;
