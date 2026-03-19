import { NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const BRAND_EMAIL_CONFIG = {
  venzo: {
    name: 'Venzo Technologies',
    senderName: 'Venzo HR Team',
    apiKey: process.env.MAILERSEND_API_KEY_VENZO || process.env.MAILERSEND_API_KEY,
    fromEmail: process.env.MAILERSEND_FROM_EMAIL_VENZO || process.env.MAILERSEND_FROM_EMAIL,
    headerBg: 'linear-gradient(135deg, #0030ce 0%, #3354d9 100%)',
    accentColor: '#0030ce',
    footerText: 'Venzo Technologies',
  },
  kytz: {
    name: 'Kytz Labs',
    senderName: 'Kytz Labs HR Team',
    apiKey: process.env.MAILERSEND_API_KEY_KYTZ || process.env.MAILERSEND_API_KEY,
    fromEmail: process.env.MAILERSEND_FROM_EMAIL_KYTZ || process.env.MAILERSEND_FROM_EMAIL,
    headerBg: '#0a1628',
    accentColor: '#c9f001',
    footerText: 'Kytz Labs',
  },
  shelfi: {
    name: 'SHELFi',
    senderName: 'SHELFi HR Team',
    apiKey: process.env.MAILERSEND_API_KEY_SHELFI || process.env.MAILERSEND_API_KEY,
    fromEmail: process.env.MAILERSEND_FROM_EMAIL_SHELFI || process.env.MAILERSEND_FROM_EMAIL,
    headerBg: '#8F0449',
    accentColor: '#8F0449',
    footerText: 'SHELFi',
  },
};

function buildCandidateEmailHtml(candidateName, brandConfig, jobTitle) {
  const b = brandConfig;
  const jobLine = jobTitle ? ` for the <strong>${jobTitle}</strong> position` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: ${b.headerBg}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { background: #f9f9f9; padding: 30px; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 13px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Applying!</h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${b.name}</p>
    </div>
    <div class="content">
      <p>Dear ${candidateName},</p>
      <p>Thank you for submitting your application${jobLine} at ${b.name}.</p>
      <p>We have received your application and our team will review it carefully. If your profile matches our requirements, we will contact you within the next 5-7 business days.</p>
      <p><strong>What's Next?</strong></p>
      <ul>
        <li>Our team will review your resume and qualifications</li>
        <li>If shortlisted, you'll receive an email to schedule an interview</li>
        <li>We'll keep you updated on your application status</li>
      </ul>
      <p>We appreciate your interest in joining ${b.name} and wish you the best of luck!</p>
      <p>Best regards,<br><strong>${b.senderName}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ${b.footerText}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildCandidateEmailText(candidateName, brandConfig, jobTitle) {
  const b = brandConfig;
  const jobLine = jobTitle ? ` for the ${jobTitle} position` : '';

  return `Dear ${candidateName},

Thank you for submitting your application${jobLine} at ${b.name}.

We have received your application and our team will review it carefully. If your profile matches our requirements, we will contact you within the next 5-7 business days.

What's Next?
- Our team will review your resume and qualifications
- If shortlisted, you'll receive an email to schedule an interview
- We'll keep you updated on your application status

We appreciate your interest in joining ${b.name} and wish you the best of luck!

Best regards,
${b.senderName}

This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} ${b.footerText}. All rights reserved.`;
}

function buildHrNotificationHtml(candidateName, candidateEmail, brandConfig, jobTitle) {
  const b = brandConfig;
  const jobRow = jobTitle ? `<div class="info-row"><span class="info-label">Position:</span><span>${jobTitle}</span></div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #2a2a2a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-row { margin: 10px 0; }
    .info-label { font-weight: bold; display: inline-block; width: 150px; }
    .brand-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; background: ${b.accentColor}; color: white; }
    .button { display: inline-block; padding: 12px 24px; background: ${b.accentColor}; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Job Application</h2>
      <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;"><span class="brand-badge">${b.name}</span></p>
    </div>
    <div class="content">
      <h3>Candidate Details</h3>
      <div class="info-row"><span class="info-label">Name:</span><span>${candidateName}</span></div>
      <div class="info-row"><span class="info-label">Email:</span><span>${candidateEmail}</span></div>
      ${jobRow}
      <div class="info-row"><span class="info-label">Company:</span><span>${b.name}</span></div>
      <div class="info-row"><span class="info-label">Applied On:</span><span>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST</span></div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button" style="color: white;">View in Dashboard</a>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request) {
  try {
    const { candidateEmail, candidateName, brand, jobTitle } = await request.json();

    if (!candidateEmail || !candidateName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const brandConfig = BRAND_EMAIL_CONFIG[brand] || BRAND_EMAIL_CONFIG.venzo;

    const mailerSend = new MailerSend({ apiKey: brandConfig.apiKey });

    const sentFrom = new Sender(
      brandConfig.fromEmail,
      brandConfig.senderName
    );

    // Email to candidate
    const candidateRecipient = new Recipient(candidateEmail, candidateName);

    const candidateEmailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo([candidateRecipient])
      .setSubject(`Application Received - ${brandConfig.name}`)
      .setHtml(buildCandidateEmailHtml(candidateName, brandConfig, jobTitle))
      .setText(buildCandidateEmailText(candidateName, brandConfig, jobTitle));

    // Email to HR team
    const hrRecipient = new Recipient(
      process.env.HR_NOTIFICATION_EMAIL,
      'HR Team'
    );

    const hrEmailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo([hrRecipient])
      .setSubject(`New Application: ${candidateName} - ${brandConfig.name}${jobTitle ? ` - ${jobTitle}` : ''}`)
      .setHtml(buildHrNotificationHtml(candidateName, candidateEmail, brandConfig, jobTitle))
      .setText(`New Job Application - ${brandConfig.name}

Candidate Details:
Name: ${candidateName}
Email: ${candidateEmail}
${jobTitle ? `Position: ${jobTitle}\n` : ''}Company: ${brandConfig.name}
Applied On: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST

View in Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);

    // Send both emails
    await mailerSend.email.send(candidateEmailParams);
    await mailerSend.email.send(hrEmailParams);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('MailerSend error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
