/**
 * Email Service — Complete Email Notification System
 */

const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Base email sender
const sendEmail = async (options) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('️ Email not configured. Skipping email send.');
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'NexusTop'}" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.email}: ${options.subject}`);
    return true;
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return false;
  }
};

// ===== EMAIL TEMPLATES =====

// 1. Order Confirmation Email
exports.sendOrderConfirmation = async (user, order) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #E5E7EB; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="background: linear-gradient(135deg, #7C3AED, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">NEXUSTOP</h1>
        <p style="color: #9CA3AF; font-size: 14px;">Gaming Top-up Platform</p>
      </div>
      
      <div style="background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #7C3AED; margin: 0 0 10px 0;">📦 Order Confirmed!</h2>
        <p style="margin: 0; color: #E5E7EB;">Hi ${user.name}, your order has been received.</p>
      </div>

      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <h3 style="color: #06B6D4; margin-top: 0;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Order ID:</td>
            <td style="padding: 10px 0; color: #06B6D4; font-weight: bold; font-family: monospace;">${order.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Game:</td>
            <td style="padding: 10px 0; color: #E5E7EB;">${order.game.icon} ${order.game.title}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Package:</td>
            <td style="padding: 10px 0; color: #E5E7EB;">${order.package.amount} ${order.game.currency}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Game ID:</td>
            <td style="padding: 10px 0; color: #E5E7EB; font-family: monospace;">${order.gameId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Amount:</td>
            <td style="padding: 10px 0; color: #F59E0B; font-size: 18px; font-weight: bold;">৳${order.totalAmount}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Status:</td>
            <td style="padding: 10px 0;"><span style="background: rgba(245,158,11,0.2); color: #F59E0B; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: bold;">${order.status.toUpperCase()}</span></td>
          </tr>
        </table>
      </div>

      <div style="background: rgba(245,158,11,0.1); border-left: 4px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin: 0; color: #F59E0B; font-size: 14px;">
          ⏱️ <strong>Note:</strong> You can cancel this order within 5 minutes of placement.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/orders.html" style="background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: bold; display: inline-block;">View My Orders</a>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 12px;">
        <p>Thank you for choosing NexusTop! 🎮</p>
        <p>If you have any questions, reply to this email.</p>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: `📦 Order Confirmed - ${order.orderId}`,
    html
  });
};

// 2. Payment Success Email
exports.sendPaymentSuccess = async (user, order) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #E5E7EB; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="background: linear-gradient(135deg, #7C3AED, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">NEXUSTOP</h1>
      </div>
      
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
        <h2 style="color: #10B981; margin: 0;">Payment Verified!</h2>
        <p style="margin: 10px 0 0 0; color: #E5E7EB;">Hi ${user.name}, your payment has been successfully verified.</p>
      </div>

      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Order ID:</td>
            <td style="padding: 10px 0; color: #06B6D4; font-family: monospace;">${order.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Amount Paid:</td>
            <td style="padding: 10px 0; color: #10B981; font-weight: bold; font-size: 18px;">৳${order.totalAmount}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Transaction ID:</td>
            <td style="padding: 10px 0; color: #E5E7EB; font-family: monospace;">${order.transactionId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Payment Method:</td>
            <td style="padding: 10px 0; color: #E5E7EB; text-transform: capitalize;">${order.paymentMethod}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 13px;">
        <p>Your order is now being processed. You will receive another email once it's completed. 🎮</p>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: `✅ Payment Verified - Order ${order.orderId}`,
    html
  });
};

// 3. Order Status Update Email
exports.sendOrderStatusUpdate = async (user, order, newStatus, reason) => {
  const statusConfig = {
    'processing': { icon: '🔄', color: '#06B6D4', message: 'Your order is now being processed.' },
    'completed': { icon: '🎉', color: '#10B981', message: 'Your order has been completed! Check your game.' },
    'cancelled': { icon: '❌', color: '#EF4444', message: `Your order has been cancelled.${reason ? ' Reason: ' + reason : ''}` },
    'refunded': { icon: '', color: '#F59E0B', message: 'A refund has been initiated for your order.' }
  };

  const config = statusConfig[newStatus] || { icon: '📦', color: '#7C3AED', message: 'Your order status has been updated.' };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #E5E7EB; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="background: linear-gradient(135deg, #7C3AED, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">NEXUSTOP</h1>
      </div>
      
      <div style="background: ${config.color}22; border: 1px solid ${config.color}66; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">${config.icon}</div>
        <h2 style="color: ${config.color}; margin: 0; text-transform: capitalize;">Order ${newStatus.replace('_', ' ')}!</h2>
        <p style="margin: 10px 0 0 0; color: #E5E7EB;">Hi ${user.name}, ${config.message}</p>
      </div>

      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Order ID:</td>
            <td style="padding: 10px 0; color: #06B6D4; font-family: monospace;">${order.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">Game:</td>
            <td style="padding: 10px 0; color: #E5E7EB;">${order.game.icon} ${order.game.title}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9CA3AF;">New Status:</td>
            <td style="padding: 10px 0;"><span style="background: ${config.color}33; color: ${config.color}; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${newStatus}</span></td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 13px;">
        <p>Thank you for using NexusTop! 🎮</p>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: `${config.icon} Order ${newStatus.replace('_', ' ').toUpperCase()} - ${order.orderId}`,
    html
  });
};

// 4. Welcome Email
exports.sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #E5E7EB; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="background: linear-gradient(135deg, #7C3AED, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">NEXUSTOP</h1>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 64px; margin-bottom: 20px;">🎮</div>
        <h2 style="color: #7C3AED; margin: 0 0 10px 0;">Welcome to NexusTop, ${user.name}!</h2>
        <p style="color: #9CA3AF; margin: 0;">Your account has been successfully created.</p>
      </div>

      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <h3 style="color: #06B6D4; margin-top: 0;">What you can do:</h3>
        <ul style="color: #E5E7EB; line-height: 1.8;">
          <li>🎯 Top-up 500+ games instantly</li>
          <li>💰 Get the best prices in the market</li>
          <li>⚡ Lightning-fast delivery in 30 seconds</li>
          <li> 100% secure transactions</li>
          <li>🎁 Earn daily rewards and bonuses</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}" style="background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: bold; display: inline-block;">Start Gaming Now</a>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 12px;">
        <p>Happy Gaming! 🚀</p>
        <p>The NexusTop Team</p>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: `🎮 Welcome to NexusTop, ${user.name}!`,
    html
  });
};

// 5. Password Reset Email
exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #E5E7EB; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="background: linear-gradient(135deg, #7C3AED, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">NEXUSTOP</h1>
      </div>
      
      <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <h2 style="color: #F59E0B; margin: 0 0 10px 0;"> Password Reset Request</h2>
        <p style="margin: 0; color: #E5E7EB;">Hi ${user.name}, we received a request to reset your password.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>

      <div style="background: rgba(239,68,68,0.1); border-left: 4px solid #EF4444; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin: 0; color: #EF4444; font-size: 14px;">
          ⚠️ This link will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
        </p>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 12px;">
        <p>Stay secure! 🔒</p>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: '🔑 Password Reset Request - NexusTop',
    html
  });
};