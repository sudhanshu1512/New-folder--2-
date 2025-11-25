import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Validate email configuration
const validateEmailConfig = () => {
  const requiredEnvVars = [
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM_EMAIL',
    'EMAIL_FROM_NAME'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`Warning: Missing email configuration variables: ${missing.join(', ')}`);
    console.warn('Email functionality may not work properly.');
    return false;
  }
  
  return true;
};

// Check email configuration on startup
const isEmailConfigured = validateEmailConfig();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // Add connection timeout and retry options for production
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000,    // 5 seconds
  socketTimeout: 10000,     // 10 seconds
});

export async function sendResetEmail(email, resetLink) {
  // Check if email is configured
  if (!isEmailConfigured) {
    console.warn('Email not configured. Skipping reset email send.');
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `Click <a href="${resetLink}">here</a> to reset your password.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email, agentDetails) {
  // Check if email is configured
  if (!isEmailConfigured) {
    console.warn('Email not configured. Skipping welcome email send.');
    return { success: false, error: 'Email not configured' };
  }

  const { firstName, lastName, businessName, agentType } = agentDetails;
  
  const welcomeHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Logo Ipsum</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 3px solid #007bff;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .welcome-title {
                color: #007bff;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .content {
                margin-bottom: 30px;
            }
            .highlight {
                background-color: #e7f3ff;
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid #007bff;
                margin: 20px 0;
            }
            .benefits {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .benefits ul {
                margin: 0;
                padding-left: 20px;
            }
            .benefits li {
                margin-bottom: 8px;
            }
            .cta-button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .contact-info {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Logo Ipsum</div>
                <p>Your Trusted Travel Partner</p>
            </div>
            
            <h1 class="welcome-title">Welcome Aboard, ${firstName}!</h1>
            
            <div class="content">
                <p>Dear ${firstName} ${lastName},</p>
                
                <p>🎉 <strong>Congratulations!</strong> Your agent registration with Logo Ipsum has been successfully completed. We're thrilled to have you join our network of professional travel agents.</p>
                
                <div class="highlight">
                    <strong>Your Registration Details:</strong><br>
                    <strong>Name:</strong> ${firstName} ${lastName}<br>
                    <strong>Email:</strong> ${email}<br>
                    ${businessName ? `<strong>Business:</strong> ${businessName}<br>` : ''}
                    <strong>Agent Type:</strong> ${agentType || 'AGENT'}<br>
                    <strong>Status:</strong> Active
                </div>
                
                <div class="benefits">
                    <h3>What's Next? Here's what you can do:</h3>
                    <ul>
                        <li>🔐 <strong>Login to your dashboard</strong> using your registered mobile number and password</li>
                        <li>✈️ <strong>Start booking flights</strong> for your customers with competitive rates</li>
                        <li>💼 <strong>Access exclusive agent tools</strong> and resources</li>
                        <li>📊 <strong>Track your bookings</strong> and commission earnings</li>
                        <li>🎯 <strong>Explore special offers</strong> and promotional fares</li>
                        <li>📞 <strong>Get dedicated support</strong> from our agent care team</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL}/login" class="cta-button">Login to Your Dashboard</a>
                </div>
                
                <div class="contact-info">
                    <h4>Need Help Getting Started?</h4>
                    <p>Our support team is here to help you every step of the way:</p>
                    <p>
                        📧 Email: support@logoipsum.com<br>
                        📞 Phone: +91-1800-123-4567<br>
                        🕒 Support Hours: Monday - Saturday, 9:00 AM - 8:00 PM IST
                    </p>
                </div>
                
                <p>We're excited to see you grow your travel business with us. Thank you for choosing Logo Ipsum as your travel technology partner!</p>
                
                <p>Best regards,<br>
                <strong>The Logo Ipsum Team</strong></p>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 Logo Ipsum. All rights reserved.</p>
                <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
    to: email,
    subject: '🎉 Welcome to Logo Ipsum - Your Agent Account is Ready!',
    html: welcomeHtml,
    // Also include a plain text version for better deliverability
    text: `
Welcome to Logo Ipsum, ${firstName}!

Congratulations! Your agent registration has been successfully completed.

Your Registration Details:
- Name: ${firstName} ${lastName}
- Email: ${email}
${businessName ? `- Business: ${businessName}\n` : ''}- Agent Type: ${agentType || 'AGENT'}
- Status: Active

What's Next?
- Login to your dashboard using your registered mobile number and password
- Start booking flights for your customers with competitive rates
- Access exclusive agent tools and resources
- Track your bookings and commission earnings
- Explore special offers and promotional fares
- Get dedicated support from our agent care team

Login URL: ${process.env.FRONTEND_URL}/login

Need Help?
Email: support@logoipsum.com
Phone: +91-1800-123-4567
Support Hours: Monday - Saturday, 9:00 AM - 8:00 PM IST

Thank you for choosing Logo Ipsum!

Best regards,
The Logo Ipsum Team
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // In production, you might want to log this to a monitoring service
    // but don't throw the error to avoid breaking the registration flow
    return { success: false, error: error.message };
  }
}

export async function sendBookingConfirmationEmail(bookingDetails, pdfBuffer) {
  if (!isEmailConfigured) {
    console.warn('Email not configured. Skipping booking confirmation email.');
    return { success: false, error: 'Email not configured' };
  }

  const { contactDetails, booking_id, flight } = bookingDetails;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
    to: contactDetails.email,
    subject: `Your Flight Booking is Confirmed! (ID: ${booking_id})`,
    html: `
      <p>Dear Customer,</p>
      <p>Your flight from <strong>${flight.from}</strong> to <strong>${flight.to}</strong> is confirmed.</p>
      <p>Your e-ticket is attached to this email. Please find your booking ID and other details in the attached PDF.</p>
      <p>Thank you for booking with us!</p>
    `,
    attachments: [
      {
        filename: `e-ticket-${booking_id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
}

export async function sendCancellationConfirmationEmail(bookingDetails, pdfBuffer) {
  if (!isEmailConfigured) {
    console.warn('Email not configured. Skipping cancellation email send.');
    return { success: false, error: 'Email not configured' };
  }

  const { contactDetails, booking_id, flight, cancellationDetails } = bookingDetails;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
    to: contactDetails.email,
    subject: `Booking Cancellation Confirmation - ID: ${booking_id}`,
    html: `
      <p>Dear Customer,</p>
      <p>This email confirms the cancellation of your booking for the flight from <strong>${flight.from} to ${flight.to}</strong>.</p>
      <p>Your Booking ID was: <strong>${booking_id}</strong></p>
      <p>A refund of <strong>₹${cancellationDetails.refundAmount.toLocaleString()}</strong> has been initiated and should reflect in your account shortly.</p>
      <p>Your cancellation invoice is attached to this email for your records.</p>
      <p>Thank you for choosing us.</p>
    `,
    attachments: [
      {
        filename: `Cancellation-Invoice-${booking_id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
}

// Add this function to your existing mailer.js file
export async function sendQueryEmail(formData) {
  // Check if email is configured
  if (!isEmailConfigured) {
    console.warn('Email not configured. Skipping query email send.');
    throw new Error('Email service not configured');
  }

  const { name, email, phone, userType, queryType, pnr, message } = formData;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
    to: process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM_EMAIL,
    subject: `New ${userType} Query: ${queryType}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; background-color: #fff; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 5px 5px; }
          .field { margin-bottom: 10px; }
          .field-label { font-weight: bold; color: #495057; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <span class="field-label">User Type:</span> ${userType}
            </div>
            <div class="field">
              <span class="field-label">Query Type:</span> ${queryType}
            </div>
            <div class="field">
              <span class="field-label">Name:</span> ${name}
            </div>
            <div class="field">
              <span class="field-label">Email:</span> <a href="mailto:${email}">${email}</a>
            </div>
            <div class="field">
              <span class="field-label">Phone:</span> ${phone || 'Not provided'}
            </div>
            ${pnr ? `<div class="field"><span class="field-label">PNR:</span> ${pnr}</div>` : ''}
            <div class="field">
              <span class="field-label">Message:</span>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="footer">
              <p>This email was sent from the Query Page ${new Date().toLocaleString()}.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Query email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending query email:', error);
    throw new Error('Failed to send query email');
  }
}


export async function sendContactEmail(formData) {
  // Check if email is configured
  if (!isEmailConfigured) {
    console.warn('Email not configured. Skipping contact email send.');
    throw new Error('Email service not configured');
  }

  const { name, email, phone, interest, message } = formData;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
    to: process.env.CONTACT_EMAIL || process.env.EMAIL_FROM_EMAIL,
    subject: `New Contact Form Submission: ${interest} Inquiry`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; background-color: #fff; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 5px 5px; }
          .field { margin-bottom: 10px; }
          .field-label { font-weight: bold; color: #495057; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <span class="field-label">Name:</span> ${name}
            </div>
            <div class="field">
              <span class="field-label">Email:</span> <a href="mailto:${email}">${email}</a>
            </div>
            ${phone ? `
            <div class="field">
              <span class="field-label">Phone:</span> ${phone}
            </div>
            ` : ''}
            <div class="field">
              <span class="field-label">Area of Interest:</span> ${interest}
            </div>
            <div class="field">
              <span class="field-label">Message:</span>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="footer">
              <p>This email was sent from the contact form on ${new Date().toLocaleString()}.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw new Error('Failed to send contact email');
  }
}
