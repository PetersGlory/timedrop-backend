const Settings = require('../models/settings');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Get user notification preferences
  async getUserPreferences(userId) {
    try {
      const settings = await Settings.findOne({ where: { userId } });
      return settings ? settings.notificationPreferences : null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Send email notification
  async sendEmailNotification(to, subject, content) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to,
        subject,
        html: content
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  // Send push notification (to be implemented with a push notification service)
  async sendPushNotification(userId, title, message, data = {}) {
    try {
      // Implement push notification logic here
      // This could use Firebase Cloud Messaging or another service
      console.log('Push notification sent:', { userId, title, message, data });
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Send SMS notification (to be implemented with an SMS service)
  async sendSMSNotification(phoneNumber, message) {
    try {
      // Implement SMS notification logic here
      // This could use Twilio or another SMS service
      console.log('SMS notification sent:', { phoneNumber, message });
      return true;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return false;
    }
  }

  // Send shipment status update notification
  async sendShipmentStatusUpdate(userId, shipment) {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences || !preferences.shipmentUpdates) {
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const statusMessages = {
        pending: 'Your shipment has been created and is pending pickup',
        picked_up: 'Your shipment has been picked up',
        in_transit: 'Your shipment is in transit',
        delivered: 'Your shipment has been delivered',
        cancelled: 'Your shipment has been cancelled'
      };

      const message = statusMessages[shipment.status];
      const emailContent = `
        <h2>Shipment Status Update</h2>
        <p>${message}</p>
        <p>Tracking Number: ${shipment.trackingNumber}</p>
        <p>Status: ${shipment.status}</p>
        <p>Estimated Delivery: ${shipment.estimatedDeliveryTime}</p>
      `;

      // Send notifications based on user preferences
      if (preferences.email) {
        await this.sendEmailNotification(
          user.email,
          'Shipment Status Update',
          emailContent
        );
      }

      if (preferences.push) {
        await this.sendPushNotification(userId, 'Shipment Update', message, {
          shipmentId: shipment.id,
          status: shipment.status
        });
      }

      if (preferences.sms && user.phone) {
        await this.sendSMSNotification(
          user.phone,
          `${message}. Tracking: ${shipment.trackingNumber}`
        );
      }

      return true;
    } catch (error) {
      console.error('Error sending shipment status update:', error);
      return false;
    }
  }

  // Send promotional notification
  async sendPromotionalNotification(userId, title, message) {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences || !preferences.promotionalOffers) {
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (preferences.email) {
        await this.sendEmailNotification(
          user.email,
          title,
          `<h2>${title}</h2><p>${message}</p>`
        );
      }

      if (preferences.push) {
        await this.sendPushNotification(userId, title, message);
      }

      return true;
    } catch (error) {
      console.error('Error sending promotional notification:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();