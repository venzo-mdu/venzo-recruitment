import { NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

export async function POST(request) {
  try {
    const { candidateEmail, candidateName } = await request.json();

    if (!candidateEmail || !candidateName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sentFrom = new Sender(
      process.env.MAILERSEND_FROM_EMAIL,
      'Venzo HR Team'
    );

    // Email to candidate
    const candidateRecipient = new Recipient(candidateEmail, candidateName);

    const candidateEmailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo([candidateRecipient])
      .setSubject('Application Received - Venzo')
      .setHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0030ce 0%, #3354d9 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Thank You for Applying!</h1>
            </div>
            <div class="content">
              <p>Dear ${candidateName},</p>
              <p>Thank you for submitting your application to Venzo.</p>
              <p>We have received your application and our HR team will review it carefully. If your profile matches our requirements, we will contact you within the next 5-7 business days.</p>
              <p><strong>What's Next?</strong></p>
              <ul>
                <li>Our HR team will review your resume and qualifications</li>
                <li>If shortlisted, you'll receive an email to schedule an interview</li>
                <li>We'll keep you updated on your application status</li>
              </ul>
              <p>We appreciate your interest in joining Venzo and wish you the best of luck!</p>
              <p>Best regards,<br><strong>Venzo HR Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Venzo. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `)
      .setText(`Dear ${candidateName},

Thank you for submitting your application to Venzo.

We have received your application and our HR team will review it carefully. If your profile matches our requirements, we will contact you within the next 5-7 business days.

What's Next?
- Our HR team will review your resume and qualifications
- If shortlisted, you'll receive an email to schedule an interview
- We'll keep you updated on your application status

We appreciate your interest in joining Venzo and wish you the best of luck!

Best regards,
Venzo HR Team

This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Venzo. All rights reserved.`);

    // Email to HR team
    const hrRecipient = new Recipient(
      process.env.HR_NOTIFICATION_EMAIL,
      'HR Team'
    );

    const hrEmailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo([hrRecipient])
      .setSubject(`New Application: ${candidateName}`)
      .setHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2a2a2a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-row { margin: 10px 0; }
            .info-label { font-weight: bold; display: inline-block; width: 150px; }
            .button { display: inline-block; padding: 12px 24px; background: #0030ce; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">New Job Application</h2>
            </div>
            <div class="content">
              <h3>Candidate Details</h3>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span>${candidateName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span>${candidateEmail}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Applied On:</span>
                <span>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST</span>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button" style="color: white;">View in Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `)
      .setText(`New Job Application

Candidate Details:
Name: ${candidateName}
Email: ${candidateEmail}
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
