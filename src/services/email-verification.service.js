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

  // Common email header styling
  getEmailHeader() {
    return `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.025em; margin: 0; font-family: 'Inter', sans-serif;">
            timedrop
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 8px 0 0 0;">Financial Prediction Markets</p>
        </div>
        <!-- Content -->
        <div style="padding: 40px 30px;">
    `;
  }

  // Common email footer
  getEmailFooter() {
    return `
        </div>
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <div style="margin-bottom: 20px;">
            <h3 style="color: #667eea; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; margin: 0;">timedrop</h3>
          </div>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Stay ahead of the markets with intelligent predictions
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This email was sent from an automated system. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
  }

  // Send verification email with code
  async sendVerificationEmail(user) {
    const verificationCode = this.generateVerificationCode();
    this.storeVerificationCode(user.id, verificationCode);

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Verify Your Timedrop Account',
      html: `
        ${this.getEmailHeader()}
        
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
          Welcome to Timedrop!
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Hi ${user.firstName || 'there'},
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Thank you for joining Timedrop, the premier platform for financial prediction markets. To complete your account setup, please verify your email address using the code below:
        </p>
        
        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0;">
          <p style="color: #64748b; font-size: 14px; font-weight: 500; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.05em;">
            Verification Code
          </p>
          <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px solid #e2e8f0;">
            ${verificationCode}
          </div>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 30px 0;">
          This verification code will expire in <strong>24 hours</strong>. If you didn't create a Timedrop account, you can safely ignore this email.
        </p>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>Security Tip:</strong> Never share your verification code with anyone. Timedrop will never ask for your code via phone or email.
          </p>
        </div>
        
        ${this.getEmailFooter()}
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

  // Send welcome email for new verified users
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Welcome to Timedrop - Start Trading Predictions',
      html: `
        ${this.getEmailHeader()}
        
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
          🎉 Welcome to Timedrop!
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hi ${user.firstName || 'there'},
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Your account has been successfully verified! You're now ready to explore the world of financial prediction markets and start making intelligent trades.
        </p>
        
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <h3 style="color: #047857; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
            What's Next?
          </h3>
          <ul style="color: #065f46; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Browse live prediction markets</li>
            <li style="margin-bottom: 8px;">Build your portfolio with smart trades</li>
            <li style="margin-bottom: 8px;">Use AI-powered predictions to guide your decisions</li>
            <li>Manage your wallet and track your performance</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://timedrop.app'}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
            Start Trading Now
          </a>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          If you have any questions, our support team is here to help. Welcome aboard!
        </p>
        
        ${this.getEmailFooter()}
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

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://timedrop.live'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Reset Your Timedrop Password',
      html: `
        ${getEmailHeader()}
        
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
          Password Reset Request
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hi ${user.firstName || 'there'},
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          We received a request to reset your Timedrop account password. Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 30px 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <div style="background-color: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="color: #dc2626; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request this reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>
        
        ${getEmailFooter()}
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(user, order, market) {
    const orderTypeColor = order.type === 'BUY' ? '#10b981' : '#ef4444';
    const orderTypeIcon = order.type === 'BUY' ? '📈' : '📉';

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: `Order Confirmation - ${order.type} ${market.question}`,
      html: `
        ${this.getEmailHeader()}
        
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
          ${orderTypeIcon} Order Confirmed
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hi ${user.firstName || 'there'},
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Your order has been successfully placed and is now active in the market.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">Order Details</h3>
          
          <div style="margin-bottom: 15px;">
            <span style="color: #64748b; font-size: 14px; font-weight: 500;">Market:</span><br>
            <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${market.question}</span>
          </div>
          
          <div style="display: flex; margin-bottom: 15px;">
            <div style="flex: 1; margin-right: 20px;">
              <span style="color: #64748b; font-size: 14px; font-weight: 500;">Order Type:</span><br>
              <span style="color: ${orderTypeColor}; font-size: 16px; font-weight: 600;">${order.type}</span>
            </div>
            <div style="flex: 1;">
              <span style="color: #64748b; font-size: 14px; font-weight: 500;">Quantity:</span><br>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${order.quantity}</span>
            </div>
          </div>
          
          <div style="display: flex; margin-bottom: 15px;">
            <div style="flex: 1; margin-right: 20px;">
              <span style="color: #64748b; font-size: 14px; font-weight: 500;">Price per Share:</span><br>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">$${order.price}</span>
            </div>
            <div style="flex: 1;">
              <span style="color: #64748b; font-size: 14px; font-weight: 500;">Total Value:</span><br>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">$${(order.price * order.quantity).toFixed(2)}</span>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <span style="color: #64748b; font-size: 14px; font-weight: 500;">Status:</span><br>
            <span style="color: #f59e0b; font-size: 16px; font-weight: 600;">${order.status}</span>
          </div>
          
          <div>
            <span style="color: #64748b; font-size: 14px; font-weight: 500;">Order Time:</span><br>
            <span style="color: #1e293b; font-size: 16px;">${new Date().toLocaleString()}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://timedrop.app'}/portfolio" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
            View Portfolio
          </a>
        </div>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
          You can track your orders and manage your portfolio anytime from your dashboard.
        </p>
        
        ${this.getEmailFooter()}
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }
  }

  // Send order filled notification
  async sendOrderFilledEmail(user, order, market) {
    const orderTypeColor = order.type === 'BUY' ? '#10b981' : '#ef4444';
    const orderTypeIcon = order.type === 'BUY' ? '✅' : '💰';

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: `Order Filled - ${order.type} ${market.question}`,
      html: `
        ${this.getEmailHeader()}
        
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
          ${orderTypeIcon} Order Filled!
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hi ${user.firstName || 'there'},
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Great news! Your order has been successfully filled in the market.
        </p>
        
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <h3 style="color: #047857; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
            Trade Completed Successfully
          </h3>
          <p style="color: #065f46; font-size: 14px; margin: 0;">
            Your ${order.type.toLowerCase()} order for ${order.quantity} shares at $${order.price} per share has been executed.
          </p>
        </div>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">Trade Summary</h3>
          
          <div style="margin-bottom: 15px;">
            <span style="color: #64748b; font-size: 14px; font-weight: 500;">Market:</span><br>
            <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${market.question}</span>
          </div>
          
          <div style="display: flex; margin-bottom: 15px;">
            <div style="flex: 1; margin-right: 20px;">
              <span style="color: #64748b; font-size: 14px; font-weight: 500;">Action:</span><br>
              <span style="color: ${orderTypeColor}; font-size: 16px; font-weight: 600;">${order.type}</span>
            </div>
            <div style="flex: 1;">
              <span style="color: #64748b; font-size: 14px; font-weight: 500;">Shares:</span><br>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${order.quantity}</span>
            </div>
          </div>
          
          <div style="display: flex; margin-bottom: 15px;">
            <div style="flex: 1; margin-right: 20px;">
              <span style="color: #64748b; font-size: 14px; font-weight: 500;">Fill Price:</span><br>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">$${order.price}</span>
            </div>
            <div style="flex: 1;">
              <span style="color: #64748b; font-size: 14px; font-weight: 500;">Total Amount:</span><br>
              <span style="color: #1e293b; font-size: 18px; font-weight: 700;">$${(order.price * order.quantity).toFixed(2)}</span>
            </div>
          </div>
          
          <div>
            <span style="color: #64748b; font-size: 14px; font-weight: 500;">Filled At:</span><br>
            <span style="color: #1e293b; font-size: 16px;">${new Date().toLocaleString()}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://timedrop.app'}/portfolio" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
            View Updated Portfolio
          </a>
        </div>
        
        ${this.getEmailFooter()}
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending order filled email:', error);
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
      
      // Send welcome email after successful verification
      await this.sendWelcomeEmail(user);
      
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
}

module.exports = new EmailVerificationService();