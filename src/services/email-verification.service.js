const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models');

class EmailVerificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    this.verificationCodes = new Map(); // Store verification codes in memory
  }

  // Generate 6-digit verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store verification code with expiration
  storeVerificationCode(userId, code) {
    this.verificationCodes.set(userId, {
      code,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  // Send verification email with code
  async sendVerificationEmail(user, password) {
    const verificationCode = this.generateVerificationCode();
    this.storeVerificationCode(user.id, verificationCode);

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Verify Your Email Address',
      html: `
        <h1>Welcome to Jingally Logistics!</h1>
        <p>Your verification code is:</p>
        <h2 style="font-size: 32px; letter-spacing: 5px; text-align: center; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">${verificationCode}</h2>
        ${password ? `<p>Your password is: ${password}</p>` : ''}
        <p>This code will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  // Send verification email with code
  async sendNewUserEmail(user, password) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Welcome to Jingally Logistics',
      html: `
        <h1>Welcome to Jingally Logistics!</h1>
        <p>Your account has been created successfully.</p>
        ${password ? `<p>Your password is: ${password}</p>` : ''}
        <p>You can now login to your account using your email and password.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // Verify email code
  async verifyEmail(userId, code) {
    try {
      const storedData = this.verificationCodes.get(userId);
      
      if (!storedData) {
        throw new Error('Verification code not found');
      }

      if (Date.now() > storedData.expiresAt) {
        this.verificationCodes.delete(userId);
        throw new Error('Verification code has expired');
      }

      if (storedData.code !== code) {
        throw new Error('Invalid verification code');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isVerified) {
        throw new Error('Email already verified');
      }

      await user.update({ isVerified: true });
      this.verificationCodes.delete(userId);
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Resend verification email
  async resendVerificationEmail(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isVerified) {
        throw new Error('Email already verified');
      }

      return await this.sendVerificationEmail(user);
    } catch (error) {
      throw error;
    }
  }

  // Send booking confirmation email
  async sendBookingConfirmationEmail(user, shipment) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Your Shipment Booking Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Shipment Booking Confirmation</h1>
          
          <p>Dear ${user.firstName},</p>
          <p>Thank you for choosing Jingally Logistic! We're excited to confirm that your booking has been successfully processed.</p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #444; margin-bottom: 15px;">Payment Details</h2>
            <p><strong>Amount:</strong> N/A </p>
            <p><strong>Status:</strong> ${shipment.paymentStatus || 'N/A'}</p>
            <p><strong>Payment Method:</strong> ${shipment.paymentMethod || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #444; margin-bottom: 15px;">Booking Details</h2>
            <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
            <p><strong>Service Type:</strong> ${shipment.serviceType}</p>
            <p><strong>Package Type:</strong> ${shipment.packageType}</p>
            <p><strong>Package Description:</strong> ${shipment.packageDescription}</p>
            <p><strong>Pickup Location:</strong> ${JSON.parse(shipment.pickupAddress).street}</p>
            <p><strong>Delivery Location:</strong> ${JSON.parse(shipment.deliveryAddress).street}</p>
            <p><strong>Receiver Name:</strong> ${shipment.receiverName}</p>
            <p><strong>Receiver Phone:</strong> ${shipment.receiverPhoneNumber}</p>
            <p><strong>Scheduled Pickup:</strong> ${new Date(shipment.scheduledPickupTime).toLocaleString()}</p>
            <p><strong>Estimated Delivery:</strong> ${new Date(shipment.estimatedDeliveryTime).toLocaleString()}</p>
          </div>

          <p>Our team is committed to ensuring a seamless and reliable delivery experience for you. Should you have any questions or require assistance, please don't hesitate to contact us at info@jingally.com or reply to this email.</p>

          <p>Stay connected with us via our app for live updates on your booking status.</p>

          <p>Once again, thank you for trusting Jingally Logistic with your logistics needs.</p>

          <p>Best regards,<br>Jingally Logistic Support Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      return false;
    }
  }

  // Send payment confirmation email
  async sendPaymentConfirmationEmail(user, shipment) {
    // Helper to safely parse address and get a field, fallback to empty string if not available
    function getAddressField(address, field) {
      try {
        const obj = typeof address === 'string' ? JSON.parse(address) : address;
        return obj && obj[field] ? obj[field] : '';
      } catch {
        return '';
      }
    }

    // Determine delivery method and pickup/dropoff label/location
    let deliveryMethod = '';
    let pickupOrDropoffLabel = '';
    let pickupOrDropoffLocation = '';
    if (shipment.deliveryType && shipment.deliveryType.toLowerCase() === 'home') {
      deliveryMethod = 'Home Pickup';
      pickupOrDropoffLabel = 'Scheduled Pickup';
      pickupOrDropoffLocation = getAddressField(shipment.pickupAddress, 'street');
    } else {
      deliveryMethod = 'Drop off at warehouse';
      pickupOrDropoffLabel = 'Scheduled Drop Off';
      pickupOrDropoffLocation = getAddressField(shipment.pickupAddress, 'street');
    }

    // Compose the email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Booking Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Payment Confirmation</h1>
          
          <p>Dear ${user.firstName || 'Customer'},</p>
          <p>Thank you for choosing Jingally Logistic! We're excited to confirm that your booking has been successfully processed.</p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #444; margin-bottom: 15px;">Payment Details</h2>
            <p><strong>Amount:</strong> N/A</p>
            <p><strong>Status:</strong> ${shipment.paymentStatus ? shipment.paymentStatus : 'pending'}</p>
            <p><strong>Payment Status:</strong> not verified</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #444; margin-bottom: 15px;">Booking Details</h2>
            <p><strong>Tracking Number:</strong> ${shipment.trackingNumber || 'N/A'}</p>
            <p><strong>Service Type:</strong> ${shipment.serviceType || 'N/A'}</p>
            <p><strong>Package Type:</strong> ${shipment.packageType || 'N/A'}</p>
            <p><strong>Package Description:</strong> ${shipment.packageDescription || 'N/A'}</p>
            <p><strong>Delivery Method:</strong> ${deliveryMethod}</p>
            <p><strong>${pickupOrDropoffLabel}:</strong> ${shipment.scheduledPickupTime ? new Date(shipment.scheduledPickupTime).toLocaleString() : 'N/A'}</p>
            <p><strong>${deliveryMethod === 'home' ? 'Pickup Location' : 'Drop Off Location'}:</strong> ${pickupOrDropoffLocation}</p>
            <p><strong>Delivery Location:</strong> ${getAddressField(shipment.deliveryAddress, 'country')}</p>
            <p><strong>Receiver Name:</strong> ${shipment.receiverName || 'N/A'}</p>
            <p><strong>Receiver Phone:</strong> ${shipment.receiverPhoneNumber || 'N/A'}</p>
            <p><strong>Estimated Delivery:</strong> ${shipment.estimatedDeliveryTime ? new Date(shipment.estimatedDeliveryTime).toLocaleString() : 'N/A'}</p>
          </div>

          <p>Our team will reach out within 6 to 24 hours to confirm your booking.</p>

          <p>We are committed to ensuring a seamless and reliable delivery experience for you. Should you have any questions or require assistance, please don't hesitate to contact us at info@jingally.com or reply to this email.</p>

          <p>Stay connected with us via our app for live updates on your booking status.</p>

          <p>Once again, thank you for trusting Jingally Logistic with your logistics needs.</p>

          <p>Best regards,<br>Jingally Logistic Support Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending payment confirmation email:', error);
      return false;
    }
  }

  // Send admin notification for new booking
  async sendAdminBookingNotification(adminEmail, user, shipment) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: adminEmail,
      subject: 'New Booking Alert - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c5282; text-align: center;">🆕 New Booking Alert</h1>
          
          <p>Dear Admin,</p>
          <p>A new booking has been submitted and requires your attention.</p>

          <div style="background-color: #ebf8ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2c5282;">
            <h2 style="color: #2c5282; margin-bottom: 15px;">Payment Details</h2>
            <p><strong>Amount:</strong> ${shipment.price ? `£20 for service charge` : 'N/A'}</p>
            <p><strong>Status:</strong> ${shipment.paymentStatus || 'Pending'}</p>
            <p><strong>Payment Status:</strong> ${shipment.paymentStatus === 'paid' ? 'Verified' : 'Not Verified'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #ebf8ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2c5282;">
            <h2 style="color: #2c5282; margin-bottom: 15px;">Booking Details</h2>
            <p><strong>Tracking Number:</strong> ${shipment.trackingNumber || 'N/A'}</p>
            <p><strong>Service Type:</strong> ${shipment.serviceType || 'N/A'}</p>
            <p><strong>Package Type:</strong> ${shipment.packageType || 'N/A'}</p>
            <p><strong>Package Description:</strong> ${shipment.packageDescription || 'N/A'}</p>
            <p><strong>Delivery Method:</strong> ${shipment.deliveryType || 'N/A'}</p>

            ${shipment.deliveryType === 'home' ? 
              `<p><strong>Pickup Location:</strong> ${JSON.parse(shipment.pickupAddress).street}, ${JSON.parse(shipment.pickupAddress).city}</p>` :
              `<p><strong>Drop-off Location:</strong> ${JSON.parse(shipment.pickupAddress).street}, ${JSON.parse(shipment.pickupAddress).city}</p>`
            }

            <p><strong>Delivery Location:</strong> ${JSON.parse(shipment.deliveryAddress).country}</p>
            <p><strong>Receiver Name:</strong> ${shipment.receiverName || 'N/A'}</p>
            <p><strong>Receiver Phone:</strong> ${shipment.receiverPhoneNumber || 'N/A'}</p>
            <p><strong>${shipment.deliveryType === 'home' ? 'Scheduled Pickup' : 'Scheduled Drop-off'}:</strong> ${shipment.scheduledPickupTime ? new Date(shipment.scheduledPickupTime).toLocaleString() : 'N/A'}</p>
            <p><strong>Estimated Delivery:</strong> ${shipment.estimatedDeliveryTime ? new Date(shipment.estimatedDeliveryTime).toLocaleString() : 'N/A'}</p>
          </div>

          <div style="background-color: #fff5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e53e3e;">
            <p style="margin: 0; color: #e53e3e;">⚠️ Please review and process this booking as soon as possible.</p>
          </div>

          <p style="color: #4a5568;">For any questions or issues, please contact the support team.</p>

          <p style="margin-top: 30px; color: #4a5568;">Best regards,<br>Jingally Logistics System</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending admin booking notification:', error);
      return false;
    }
  }

  // Send shipment status update email
  async sendShipmentStatusUpdateEmail(user, shipment) {
    const statusMessages = {
      'picked_up': 'Your shipment has been picked up and is now in our possession.',
      'in_transit': 'Your shipment is now in transit and on its way to the destination.',
      'delivered': 'Your shipment has been successfully delivered!',
      'cancelled': 'Your shipment has been cancelled.'
    };

    const statusEmojis = {
      'picked_up': '📦',
      'in_transit': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: `Shipment Status Update: ${shipment.status.replace('_', ' ').toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">
            ${statusEmojis[shipment.status]} Shipment Status Update
          </h1>
          
          <p>Dear ${user.firstName},</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #444; margin-bottom: 15px;">Status Update</h2>
            <p style="font-size: 18px; color: #2c5282;">
              <strong>${shipment.status.replace('_', ' ').toUpperCase()}</strong>
            </p>
            <p>${statusMessages[shipment.status]}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #444; margin-bottom: 15px;">Shipment Details</h2>
            <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
            <p><strong>Package Type:</strong> ${shipment.packageType || 'N/A'}</p>
            ${shipment.packageDescription ? `<p><strong>Description:</strong> ${shipment.packageDescription}</p>` : ''}
            ${shipment.fragile ? '<p><strong>⚠️ Fragile Package</strong></p>' : ''}
          </div>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #444; margin-bottom: 15px;">Location Details</h2>
            <div style="margin-bottom: 15px;">
              <h3 style="color: #555; margin-bottom: 5px;">Pickup Address</h3>
              <p>${shipment.pickupAddress.street}<br>
              ${shipment.pickupAddress.city}, ${shipment.pickupAddress.state}<br>
              ${shipment.pickupAddress.country}</p>
            </div>
            <div>
              <h3 style="color: #555; margin-bottom: 5px;">Delivery Address</h3>
              <p>${shipment.deliveryAddress.street}<br>
              ${shipment.deliveryAddress.city}, ${shipment.deliveryAddress.state}<br>
              ${shipment.deliveryAddress.country}</p>
            </div>
          </div>

          ${shipment.driver ? `
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h2 style="color: #444; margin-bottom: 15px;">Driver Information</h2>
              <p><strong>Driver Name:</strong> ${shipment.driver.firstName} ${shipment.driver.lastName}</p>
              <p><strong>Contact:</strong> ${shipment.driver.phone}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666;">You can track your shipment status anytime using your tracking number: <strong>${shipment.trackingNumber}</strong></p>
            <p style="color: #666;">For any questions or concerns, please contact our support team.</p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666;">Best regards,<br>Jingally Logistic Support Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending shipment status update email:', error);
      return false;
    }
  }
}

module.exports = new EmailVerificationService();
