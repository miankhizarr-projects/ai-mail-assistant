import mongoose, { Schema } from 'mongoose';
import { User, EmailMessage, Conversation, AgentAction, EmailTemplate } from '../../src/types';

let isConnected = false;

// Mongoose Schemas & Models for persistent MongoDB storage
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  googleId: String,
  email: { type: String, required: true },
  name: String,
  username: String,
  password: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpiresAt: String,
  picture: String,
  isConnectedToGmail: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const ConversationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  title: String,
  messages: { type: Array, default: [] },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const AgentActionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  conversationId: String,
  tool: String,
  input: Schema.Types.Mixed,
  output: Schema.Types.Mixed,
  status: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const EmailSummarySchema = new Schema({
  emailId: { type: String, required: true, unique: true },
  summary: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const EmailTemplateSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  category: { type: String, default: 'custom' },
  subjectTemplate: String,
  htmlContent: { type: String, required: true },
  isBuiltIn: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const AgentMemorySchema = new Schema({
  userId: { type: String, required: true, index: true },
  key: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  category: { type: String, default: 'preference' },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const ConversationModel = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
export const AgentActionModel = mongoose.models.AgentAction || mongoose.model('AgentAction', AgentActionSchema);
export const EmailSummaryModel = mongoose.models.EmailSummary || mongoose.model('EmailSummary', EmailSummarySchema);
export const EmailTemplateModel = mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', EmailTemplateSchema);
export const AgentMemoryModel = mongoose.models.AgentMemory || mongoose.model('AgentMemory', AgentMemorySchema);

// Built-in Pre-seeded High Quality HTML Email Templates
export const DEMO_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-corporate',
    name: 'Professional Business Letter',
    description: 'Clean corporate header with branded card body and actionable call to action.',
    category: 'business',
    subjectTemplate: '{{subject}}',
    isBuiltIn: true,
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: #1e293b; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px; line-height: 1.6; font-size: 15px; }
    .button-container { text-align: center; margin: 28px 0; }
    .btn { background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 14px; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{subject}}</h1>
    </div>
    <div class="content">
      <p>Dear {{recipientName}},</p>
      <div>{{bodyContent}}</div>
      <div class="button-container">
        <a href="{{ctaLink}}" class="btn">{{ctaText}}</a>
      </div>
      <p>Best regards,<br><strong>{{senderName}}</strong></p>
    </div>
    <div class="footer">
      <p>Sent via AI Mail Assistant • Confidential Corporate Communication</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'tpl-invitation',
    name: 'Meeting & Event Invitation',
    description: 'Vibrant card invite featuring date/time badge and agenda breakdown.',
    category: 'invitation',
    subjectTemplate: 'Invitation: {{subject}}',
    isBuiltIn: true,
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #1f2937; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; shadow: 0 10px 25px rgba(0,0,0,0.08); }
    .hero { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; color: #ffffff; text-align: center; }
    .hero h2 { margin: 0 0 8px 0; font-size: 22px; font-weight: 800; }
    .hero p { margin: 0; opacity: 0.9; font-size: 14px; }
    .body-padding { padding: 28px; }
    .info-box { background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .info-item { margin-bottom: 8px; font-size: 14px; }
    .info-item:last-child { margin-bottom: 0; }
    .btn-rsvp { display: block; width: 80%; margin: 24px auto 12px auto; text-align: center; background: #4f46e5; color: #ffffff !important; padding: 14px; border-radius: 10px; font-weight: 700; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="hero">
      <h2>{{subject}}</h2>
      <p>You are invited to join an upcoming session</p>
    </div>
    <div class="body-padding">
      <p>Hi {{recipientName}},</p>
      <div>{{bodyContent}}</div>
      <div class="info-box">
        <div class="info-item">📅 <strong>Event:</strong> {{subject}}</div>
        <div class="info-item">👤 <strong>Host:</strong> {{senderName}}</div>
      </div>
      <a href="{{ctaLink}}" class="btn-rsvp">{{ctaText}}</a>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'tpl-newsletter',
    name: 'Product & Newsletter Announcement',
    description: 'High impact newsletter theme with bold headlines and highlight cards.',
    category: 'newsletter',
    subjectTemplate: '[Announcement] {{subject}}',
    isBuiltIn: true,
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 20px; color: #222; }
    .wrapper { max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #eee; border-radius: 8px; padding: 30px; }
    .logo { font-size: 20px; font-weight: bold; color: #0284c7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: 800; margin-top: 0; color: #0f172a; }
    .cta-button { display: inline-block; background-color: #0284c7; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 15px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo">Mail Intelligence</div>
    <h1 class="title">{{subject}}</h1>
    <p>Hello {{recipientName}},</p>
    <div>{{bodyContent}}</div>
    <p><a href="{{ctaLink}}" class="cta-button">{{ctaText}}</a></p>
    <div class="footer">
      <p>© 2026 AI Mail Assistant. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'tpl-dark-minimal',
    name: 'Dark Minimalist Executive',
    description: 'Sleek dark theme with glowing violet accent borders and crisp typography.',
    category: 'custom',
    subjectTemplate: '{{subject}}',
    isBuiltIn: true,
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background-color: #020617; margin: 0; padding: 24px; color: #f8fafc; }
    .card { max-width: 580px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid rgba(129, 140, 248, 0.3); padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .badge { display: inline-block; background: rgba(129, 140, 248, 0.15); color: #818cf8; border: 1px solid rgba(129, 140, 248, 0.3); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; }
    .body-text { font-size: 14px; line-height: 1.7; color: #cbd5e1; }
    .btn-dark { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 13px; padding: 12px 24px; border-radius: 8px; margin-top: 20px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Executive Communication</div>
    <h1>{{subject}}</h1>
    <div class="body-text">
      <p>Hello {{recipientName}},</p>
      <div>{{bodyContent}}</div>
      <a href="{{ctaLink}}" class="btn-dark">{{ctaText}}</a>
    </div>
  </div>
</body>
</html>`
  }
];

// Sample Mock Emails for Demo mode when Gmail is not yet authorized or for instant testing
export const DEMO_EMAILS: EmailMessage[] = [
  {
    id: 'msg-101',
    threadId: 'thread-101',
    sender: 'Ahmed Al-Mansoor <ahmed@techcorp.io>',
    recipients: ['me@example.com'],
    subject: 'Project Update & Delivery Schedule',
    snippet: 'Hi, here is the latest update regarding our API integration...',
    body: `Hi,

Here is the latest update regarding our API integration project:
- The REST endpoint implementation is 100% complete.
- We have started automated unit tests on the staging server.
- Critical requirement: All final source files need to be delivered tonight by 9 PM.

Please let me know if you can send the source code files tonight so we stay on schedule for tomorrow's demo.

Best regards,
Ahmed Al-Mansoor
Tech Lead, TechCorp`,
    htmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #4338ca; font-size: 20px;">Project Update & Delivery Schedule</h2>
    <span style="display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; margin-top: 8px;">High Priority</span>
  </div>
  <p>Hi,</p>
  <p>Here is the latest update regarding our API integration project:</p>
  <ul style="line-height: 1.8; color: #334155;">
    <li>The REST endpoint implementation is <strong>100% complete</strong>.</li>
    <li>We have started automated unit tests on the staging server.</li>
    <li><strong style="color: #dc2626;">Critical requirement:</strong> All final source files need to be delivered tonight by 9 PM.</li>
  </ul>
  <p>Please review our latest deployment dashboard at <a href="https://techcorp.io/projects/api-v2" target="_blank" style="color: #2563eb; text-decoration: underline;">https://techcorp.io/projects/api-v2</a></p>
  <div style="margin: 24px 0; padding: 16px; background: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px;">
    <strong>Next Action Required:</strong> Upload final source zip before 9 PM tonight.
  </div>
  <p>Best regards,<br><strong>Ahmed Al-Mansoor</strong><br><span style="color: #64748b; font-size: 13px;">Tech Lead, TechCorp</span></p>
</div>`,
    date: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    labels: ['UNREAD', 'INBOX', 'IMPORTANT', 'STARRED'],
    isRead: false,
    isImportant: true,
    isStarred: true,
    aiSummary: 'Ahmed completed REST integration. Needs final files delivered tonight by 9 PM for tomorrow\'s demo.',
    category: 'important',
    priority: 'high',
    extractedTasks: [
      {
        id: 'task-1',
        task: 'Deliver final source files to Ahmed tonight before 9 PM',
        personResponsible: 'You',
        deadline: 'Tonight 9 PM',
        relevantEmailId: 'msg-101',
        completed: false
      }
    ]
  },
  {
    id: 'msg-102',
    threadId: 'thread-102',
    sender: 'Sara Connor <sara.c@designstudio.org>',
    recipients: ['me@example.com'],
    subject: 'Meeting Tomorrow at 4 PM - Design Sync',
    snippet: 'Hi team, confirming our design review session tomorrow afternoon...',
    body: `Hi team,

Confirming our design review session tomorrow afternoon at 4:00 PM EST.

Agenda:
1. Review modern dashboard UI component guidelines.
2. Discuss color palette and responsive mobile views.
3. Finalize prototype approval.

Please review the attached Figma link before the call if you get a chance!

See you tomorrow,
Sara`,
    htmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; border-radius: 8px; color: #ffffff; text-align: center; margin-bottom: 20px;">
    <h2 style="margin: 0 0 6px 0; font-size: 20px;">Meeting Invitation: Design Sync</h2>
    <p style="margin: 0; opacity: 0.9; font-size: 14px;">📅 Tomorrow at 4:00 PM EST</p>
  </div>
  <p>Hi team,</p>
  <p>Confirming our design review session tomorrow afternoon at 4:00 PM EST.</p>
  <h4 style="color: #4f46e5; margin-bottom: 8px;">Agenda:</h4>
  <ol style="line-height: 1.8; color: #334155;">
    <li>Review modern dashboard UI component guidelines.</li>
    <li>Discuss color palette and responsive mobile views.</li>
    <li>Finalize prototype approval.</li>
  </ol>
  <p>Please review the interactive prototype on Figma before our call:</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://figma.com/@designstudio/dashboard-v2-prototype" target="_blank" style="background: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block;">Open Figma Prototype</a>
  </div>
  <p>See you tomorrow,<br><strong>Sara Connor</strong></p>
</div>`,
    date: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    labels: ['UNREAD', 'INBOX'],
    isRead: false,
    isImportant: false,
    aiSummary: 'Sara confirmed design sync meeting tomorrow at 4 PM EST to review dashboard UI and Figma link.',
    category: 'primary',
    priority: 'medium',
    extractedTasks: [
      {
        id: 'task-2',
        task: 'Review Figma link before tomorrow 4 PM design sync meeting',
        personResponsible: 'You',
        deadline: 'Tomorrow 4:00 PM',
        relevantEmailId: 'msg-102',
        completed: false
      }
    ]
  },
  {
    id: 'msg-105',
    threadId: 'thread-105',
    sender: 'Elena Vance <elena@producthub.co>',
    recipients: ['me@example.com'],
    subject: 'Q4 Product Roadmap & Key Architecture Milestones',
    snippet: 'Please find attached the starred strategic priorities for our Q4 release cycle...',
    body: `Hi team,

I have compiled our key strategic priorities and architecture goals for Q4:
- Microservice migration & serverless API caching layer
- Integrated AI email summarizer & auto-responder
- User security audit & OAuth 2.0 refresh flow

This document is starred for high priority review before our executive meeting.

Best,
Elena`,
    date: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    labels: ['INBOX', 'STARRED'],
    isRead: true,
    isImportant: true,
    isStarred: true,
    aiSummary: 'Elena outlined Q4 roadmap including microservices, AI email agent, and OAuth security.',
    category: 'starred',
    priority: 'high'
  },
  {
    id: 'msg-201',
    threadId: 'thread-201',
    sender: 'Me <me@example.com>',
    recipients: ['elena@producthub.co'],
    subject: 'Draft: Partnership Proposal - TechCorp Integration',
    snippet: 'Hi Elena, Following up on our initial discussion regarding the partnership...',
    body: `Hi Elena,

Following up on our initial discussion regarding the partnership integration. We are ready to move forward with phase 1.

Key points:
- API credentials configuration
- Sandbox testing environment
- Dedicated Slack channel for dev teams

Looking forward to your feedback.

Best,
Me`,
    date: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    labels: ['DRAFT'],
    isRead: true,
    isDraft: true,
    category: 'drafts'
  },
  {
    id: 'msg-202',
    threadId: 'thread-202',
    sender: 'Me <me@example.com>',
    recipients: ['sara.c@designstudio.org'],
    subject: 'Draft: Re: Meeting Tomorrow at 4 PM',
    snippet: 'Hi Sara, I reviewed the Figma wireframes and everything looks great...',
    body: `Hi Sara,

I reviewed the Figma wireframes and everything looks great. I have two quick suggestions for the responsive mobile navigation bar.

See you tomorrow at 4 PM!`,
    date: new Date(Date.now() - 1000 * 60 * 700).toISOString(),
    labels: ['DRAFT'],
    isRead: true,
    isDraft: true,
    category: 'drafts'
  },
  {
    id: 'msg-301',
    threadId: 'thread-301',
    sender: 'Amazon.com <auto-confirm@amazon.com>',
    recipients: ['me@example.com'],
    subject: 'Amazon Order Confirmation #114-92019-38291',
    snippet: 'Thank you for your order! Keychron K2 Wireless Mechanical Keyboard...',
    body: `Order Confirmation #114-92019-38291

Thank you for shopping with Amazon!

Item: Keychron K2 Wireless Mechanical Keyboard, RGB Backlit ($89.00)
Quantity: 1
Estimated Delivery: Tomorrow by 8:00 PM
Total Charged: $96.12 to Visa ending in 4019

Track your package: https://amazon.com/orders/114-92019-38291`,
    htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #dddddd; padding: 24px; border-radius: 8px;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ff9900; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="color: #111111; margin: 0; font-size: 20px;">Amazon Order Confirmation</h2>
    <span style="color: #555555; font-size: 13px;">#114-92019-38291</span>
  </div>
  <p>Thank you for shopping with Amazon!</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <thead>
      <tr style="background: #f7f7f7; text-align: left; font-size: 13px;">
        <th style="padding: 10px; border-bottom: 1px solid #ddd;">Item</th>
        <th style="padding: 10px; border-bottom: 1px solid #ddd;">Qty</th>
        <th style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Price</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 14px;">Keychron K2 Wireless Mechanical Keyboard (RGB Backlit)</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 14px;">1</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 14px; text-align: right;">$89.00</td>
      </tr>
    </tbody>
  </table>
  <div style="background: #fdf8f0; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
    <p style="margin: 0 0 6px 0; font-weight: bold; color: #232f3e;">Estimated Delivery: Tomorrow by 8:00 PM</p>
    <p style="margin: 0; font-size: 13px; color: #555;">Total Charged: $96.12 to Visa ending in 4019</p>
  </div>
  <div style="text-align: center;">
    <a href="https://amazon.com/orders/114-92019-38291" target="_blank" style="background: #ff9900; color: #111111; padding: 12px 28px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">Track Your Package</a>
  </div>
</div>`,
    date: new Date(Date.now() - 1000 * 60 * 850).toISOString(),
    labels: ['INBOX', 'PURCHASES'],
    isRead: true,
    isImportant: false,
    category: 'purchases',
    aiSummary: 'Amazon order confirmation #114-92019-38291 for Keychron K2 Mechanical Keyboard ($96.12).'
  },
  {
    id: 'msg-302',
    threadId: 'thread-302',
    sender: 'Apple Store <no_reply@email.apple.com>',
    recipients: ['me@example.com'],
    subject: 'Receipt for your Apple Purchase - iCloud+ & Developer Services',
    snippet: 'Invoice #APL-998231. Total paid: $14.99 for monthly iCloud+ storage...',
    body: `Apple Store Official Receipt

Invoice ID: APL-998231
Date: August 12, 2026

Items:
1. iCloud+ 200GB Storage Subscription ($2.99)
2. Developer Cloud Server Plan ($12.00)

Total Paid: $14.99 via Apple Pay
Billed to: me@example.com`,
    htmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1d1d1f; padding: 28px; border-radius: 12px; border: 1px solid #d2d2d7;">
  <div style="text-align: center; border-bottom: 1px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 22px; font-weight: 600;">Apple Store Receipt</h2>
    <p style="margin: 4px 0 0 0; color: #86868b; font-size: 13px;">Invoice APL-998231 • August 12, 2026</p>
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr style="border-bottom: 1px solid #f2f2f2;">
      <td style="padding: 12px 0; font-size: 14px;"><strong>iCloud+ 200GB Storage Subscription</strong></td>
      <td style="padding: 12px 0; text-align: right; font-size: 14px;">$2.99</td>
    </tr>
    <tr style="border-bottom: 1px solid #f2f2f2;">
      <td style="padding: 12px 0; font-size: 14px;"><strong>Developer Cloud Server Plan</strong></td>
      <td style="padding: 12px 0; text-align: right; font-size: 14px;">$12.00</td>
    </tr>
    <tr>
      <td style="padding: 16px 0; font-size: 16px;"><strong>Total Paid</strong></td>
      <td style="padding: 16px 0; text-align: right; font-size: 18px; color: #0071e3; font-weight: bold;">$14.99</td>
    </tr>
  </table>
  <div style="text-align: center; font-size: 13px; color: #86868b;">
    Billed to: me@example.com via Apple Pay<br>
    <a href="https://support.apple.com/billing" target="_blank" style="color: #0071e3; text-decoration: none;">Manage Subscriptions & Billing →</a>
  </div>
</div>`,
    date: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
    labels: ['INBOX', 'PURCHASES'],
    isRead: true,
    category: 'purchases',
    aiSummary: 'Apple receipt for $14.99 for iCloud+ and Developer Cloud Server Plan.'
  },
  {
    id: 'msg-401',
    threadId: 'thread-401',
    sender: 'Prize Alert <claim-now@spamprize-alert99.net>',
    recipients: ['me@example.com'],
    subject: 'URGENT: You won $10,000 Cash Prize Instant Claim!',
    snippet: 'Congratulations! Click here within 24 hours to claim your wire transfer...',
    body: `CONGRATULATIONS!

Your email was randomly selected in our international lottery to win $10,000 USD.

Click the link below immediately to enter your banking details and claim your prize before it expires!
http://claim-prize-wire-transfer.xyz/verify`,
    date: new Date(Date.now() - 1000 * 60 * 950).toISOString(),
    labels: ['SPAM'],
    isRead: true,
    isSpam: true,
    category: 'spam'
  },
  {
    id: 'msg-402',
    threadId: 'thread-402',
    sender: 'Crypto Wealth Daily <newsletter@crypto-fast-wealth.xyz>',
    recipients: ['me@example.com'],
    subject: 'Guaranteed 500% ROI Crypto Automated Trading Bot',
    snippet: 'Unlock secret algorithmic trading bot with zero risk and 5x returns...',
    body: `Get rich quick with our automated crypto trading bot!

Zero risk, 500% returns guaranteed within 7 days.
Join over 50,000 satisfied investors making passive income.`,
    date: new Date(Date.now() - 1000 * 60 * 1600).toISOString(),
    labels: ['SPAM'],
    isRead: true,
    isSpam: true,
    category: 'spam'
  },
  {
    id: 'msg-501',
    threadId: 'thread-501',
    sender: 'Me <me@example.com>',
    recipients: ['investors@techcorp.io'],
    subject: 'Scheduled: Q3 Investor Quarterly Briefing',
    snippet: 'Scheduled for tomorrow 9:00 AM. Dear Investors, Attached is our Q3 update...',
    body: `Dear Investors & Board Members,

Attached is our comprehensive Q3 financial performance update and engineering velocity milestone report.

Key Highlights:
- Quarterly Revenue: +42% QoQ
- System Latency: Reduced by 35%
- Active Enterprise Customers: 148

Best regards,
Mail Assistant Team`,
    date: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
    labels: ['SCHEDULED'],
    isRead: true,
    isScheduled: true,
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(), // Tomorrow 9 AM
    category: 'scheduled'
  },
  {
    id: 'msg-502',
    threadId: 'thread-502',
    sender: 'Me <me@example.com>',
    recipients: ['dev-team@techcorp.io'],
    subject: 'Scheduled: Weekly Engineering Digest & Sprint Retrospective',
    snippet: 'Scheduled for Monday 8:30 AM. Team, here are the action items for next sprint...',
    body: `Hi Team,

Here is our weekly engineering digest and key goals for the upcoming sprint:
1. Complete Gmail API OAuth token refresh handler.
2. Deploy AI agent tools for Starred, Drafts, Purchases, Spam, and Scheduled mail folders.
3. Conduct frontend performance audit.

Please review before our Monday morning standup.`,
    date: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    labels: ['SCHEDULED'],
    isRead: true,
    isScheduled: true,
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    category: 'scheduled'
  },
  {
    id: 'msg-103',
    threadId: 'thread-103',
    sender: 'Google Cloud Platform <no-reply@cloud.google.com>',
    recipients: ['me@example.com'],
    subject: 'Security Alert: New sign-in detected on Cloud Run',
    snippet: 'Your Google Cloud account was used to sign in to Cloud Run service...',
    body: `Security Notification:

A new sign-in was detected on your Google Cloud project (AI Studio Applet container).

Location: Cloud Run / US-East
Timestamp: ${new Date().toLocaleString()}

If this was you, no action is needed. If you did not recognize this activity, please review your account credentials immediately.`,
    date: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hours ago
    labels: ['INBOX'],
    isRead: true,
    isImportant: false,
    aiSummary: 'Security notification regarding new Cloud Run sign-in.',
    category: 'updates',
    priority: 'low'
  },
  {
    id: 'msg-104',
    threadId: 'thread-104',
    sender: 'Netlify Billing <support@netlify.com>',
    recipients: ['me@example.com'],
    subject: 'Monthly Usage & Invoice Report - August 2026',
    snippet: 'Your monthly Netlify statement for bandwidth and build minutes is available...',
    body: `Hello,

Your monthly usage report for August 2026 is ready.
Total Bandwidth: 14.2 GB / 100 GB
Build Minutes: 120 / 300 minutes
Amount Due: $0.00 (Free Tier)

Thank you for hosting with Netlify!`,
    date: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 1 day ago
    labels: ['INBOX'],
    isRead: true,
    isImportant: false,
    aiSummary: 'Monthly Netlify invoice statement showing $0.00 due within free tier bounds.',
    category: 'updates',
    priority: 'low'
  }
];

// Hybrid Database Store: Persistent MongoDB + In-Memory Caching
class DatabaseStore {
  private inMemoryUsers: Map<string, User> = new Map();
  private inMemoryEmails: Map<string, EmailMessage> = new Map();
  private inMemoryConversations: Map<string, Conversation> = new Map();
  private inMemoryEmailSummaries: Map<string, string> = new Map();
  private inMemoryTemplates: Map<string, EmailTemplate> = new Map();
  private inMemoryAgentActions: AgentAction[] = [];

  constructor() {
    DEMO_EMAILS.forEach(email => {
      this.inMemoryEmails.set(email.id, { ...email });
      if (email.aiSummary) {
        this.inMemoryEmailSummaries.set(email.id, email.aiSummary);
      }
    });

    DEMO_TEMPLATES.forEach(tpl => {
      this.inMemoryTemplates.set(tpl.id, { ...tpl });
    });
  }

  async syncFromMongoDB(): Promise<void> {
    if (!isConnected) return;
    try {
      const dbUsers = await UserModel.find().lean();
      for (const u of dbUsers) {
        this.inMemoryUsers.set(u.id, u as User);
      }

      const dbConvs = await ConversationModel.find().lean();
      for (const c of dbConvs) {
        this.inMemoryConversations.set(c.id, c as Conversation);
      }

      const dbSummaries = await EmailSummaryModel.find().lean();
      for (const s of dbSummaries) {
        if ((s as any).emailId && (s as any).summary) {
          this.inMemoryEmailSummaries.set((s as any).emailId, (s as any).summary);
        }
      }

      const dbTemplates = await EmailTemplateModel.find().lean();
      for (const t of dbTemplates) {
        this.inMemoryTemplates.set(t.id, t as unknown as EmailTemplate);
      }

      const dbActions = await AgentActionModel.find().sort({ createdAt: -1 }).limit(100).lean();
      this.inMemoryAgentActions = dbActions as AgentAction[];
      console.log(`[DB STORE] Synced ${dbUsers.length} users, ${dbConvs.length} conversations, ${dbSummaries.length} email summaries, and ${dbTemplates.length} custom templates from MongoDB.`);
    } catch (err) {
      console.error('[DB STORE] Failed to sync from MongoDB:', err);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalized = email.trim().toLowerCase();
    let user = Array.from(this.inMemoryUsers.values()).find(u => u.email.toLowerCase() === normalized);
    if (!user && isConnected) {
      try {
        const dbUser = await UserModel.findOne({ email: normalized } as any).lean();
        if (dbUser) {
          user = dbUser as unknown as User;
          this.inMemoryUsers.set(user.id, user);
        }
      } catch (err) {
        console.error('[DB STORE] Mongo getUserByEmail error:', err);
      }
    }
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (this.inMemoryUsers.has(id)) {
      return this.inMemoryUsers.get(id);
    }
    if (isConnected) {
      try {
        const dbUser = await UserModel.findOne({ id } as any).lean();
        if (dbUser) {
          const user = dbUser as unknown as User;
          this.inMemoryUsers.set(id, user);
          return user;
        }
      } catch (err) {
        console.error('[DB STORE] Mongo getUserById error:', err);
      }
    }
    return undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    let user = Array.from(this.inMemoryUsers.values()).find(u => u.verificationToken === token);
    if (!user && isConnected) {
      try {
        const dbUser = await UserModel.findOne({ verificationToken: token } as any).lean();
        if (dbUser) {
          user = dbUser as unknown as User;
          this.inMemoryUsers.set(user.id, user);
        }
      } catch (err) {
        console.error('[DB STORE] Mongo getUserByVerificationToken error:', err);
      }
    }
    return user;
  }

  async createUser(data: { username: string; email: string; password?: string }, baseUrl: string = 'http://localhost:3000'): Promise<{ user: User; token: string; verificationUrl: string; expiresAt: string }> {
    const email = data.email.trim().toLowerCase();
    const existing = await this.getUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const token = 'vtok_' + Math.random().toString(36).substr(2, 10) + '_' + Date.now();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes expiration

    const newUser: User = {
      id: userId,
      email,
      name: data.username,
      username: data.username,
      password: data.password,
      isVerified: false,
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
      isConnectedToGmail: false,
      createdAt: new Date().toISOString()
    };

    await this.saveUser(newUser);

    const verificationUrl = `${baseUrl}/verify?token=${token}`;

    // Send verification email to user mail with Sender: mypcaccc01@gmail.com
    const verificationEmail: EmailMessage = {
      id: 'msg-verify-' + Date.now(),
      threadId: 'thread-verify-' + Date.now(),
      sender: 'AI Mail Security <mypcaccc01@gmail.com>',
      recipients: [email],
      subject: 'Verify your AI Mail Assistant Account',
      snippet: 'Please verify your email address. This link expires in 15 minutes.',
      body: `Hello ${data.username},

Thank you for registering with AI Mail Assistant!

Please click the link below to verify your email address and activate your account:
${verificationUrl}

Note: This verification link is valid for 15 minutes (expires at ${new Date(expiresAt).toLocaleTimeString()}).

Sender: mypcaccc01@gmail.com
Best regards,
AI Mail Assistant Security Team`,
      date: new Date().toISOString(),
      labels: ['UNREAD', 'INBOX', 'IMPORTANT'],
      isRead: false,
      isImportant: true,
      category: 'important'
    };

    this.saveEmail(verificationEmail);

    return { user: newUser, token, verificationUrl, expiresAt };
  }

  async verifyUserToken(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!token) {
      return { success: false, error: 'Verification token is required.' };
    }

    const user = await this.getUserByVerificationToken(token);
    if (!user) {
      return { success: false, error: 'Token not found in database or invalid.' };
    }

    if (!user.verificationTokenExpiresAt || new Date() > new Date(user.verificationTokenExpiresAt)) {
      return { success: false, error: 'Verification token has expired (15-minute time limit).' };
    }

    // Set isVerified to true in DB
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;

    await this.saveUser(user);

    return { success: true, user };
  }

  async getOrCreateUser(email: string = 'demo.user@gmail.com', name: string = 'Demo User'): Promise<User> {
    let user = Array.from(this.inMemoryUsers.values()).find(u => u.email === email);

    if (!user && isConnected) {
      try {
        const dbUser = await UserModel.findOne({ email } as any).lean();
        if (dbUser) {
          user = dbUser as unknown as User;
          this.inMemoryUsers.set(user.id, user);
        }
      } catch (err) {
        console.error('[DB STORE] Mongo getOrCreateUser error:', err);
      }
    }

    if (!user) {
      user = {
        id: 'usr_' + Date.now(),
        email,
        name,
        isConnectedToGmail: false,
        createdAt: new Date().toISOString()
      };
      this.inMemoryUsers.set(user.id, user);

      if (isConnected) {
        try {
          await UserModel.create(user);
        } catch (err) {
          console.error('[DB STORE] Mongo create user error:', err);
        }
      }
    }

    return user;
  }

  async saveUser(user: User): Promise<User> {
    this.inMemoryUsers.set(user.id, user);
    if (isConnected) {
      try {
        await UserModel.findOneAndUpdate({ id: user.id } as any, user, { upsert: true, new: true });
      } catch (err) {
        console.error('[DB STORE] Mongo saveUser error:', err);
      }
    }
    return user;
  }

  getEmails(userId?: string): EmailMessage[] {
    return Array.from(this.inMemoryEmails.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  getEmailById(id: string): EmailMessage | undefined {
    return this.inMemoryEmails.get(id);
  }

  saveEmail(email: EmailMessage): EmailMessage {
    this.inMemoryEmails.set(email.id, email);
    return email;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    if (isConnected) {
      try {
        const dbConvs = await ConversationModel.find({ userId } as any).sort({ updatedAt: -1 }).lean();
        if (dbConvs && dbConvs.length > 0) {
          for (const c of dbConvs) {
            this.inMemoryConversations.set(c.id, c as unknown as Conversation);
          }
          return dbConvs as unknown as Conversation[];
        }
      } catch (err) {
        console.error('[DB STORE] Mongo getConversations error:', err);
      }
    }

    return Array.from(this.inMemoryConversations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    if (this.inMemoryConversations.has(id)) {
      return this.inMemoryConversations.get(id);
    }

    if (isConnected) {
      try {
        const dbConv = await ConversationModel.findOne({ id } as any).lean();
        if (dbConv) {
          const conv = dbConv as unknown as Conversation;
          this.inMemoryConversations.set(conv.id, conv);
          return conv;
        }
      } catch (err) {
        console.error('[DB STORE] Mongo getConversationById error:', err);
      }
    }

    return undefined;
  }

  async saveConversation(conv: Conversation): Promise<Conversation> {
    this.inMemoryConversations.set(conv.id, conv);

    if (isConnected) {
      try {
        await ConversationModel.findOneAndUpdate({ id: conv.id } as any, conv, { upsert: true, new: true });
        console.log(`[DB STORE] Saved conversation ${conv.id} to MongoDB.`);
      } catch (err) {
        console.error('[DB STORE] Mongo saveConversation error:', err);
      }
    }

    return conv;
  }

  async logAction(action: Omit<AgentAction, 'id' | 'createdAt'>): Promise<AgentAction> {
    const fullAction: AgentAction = {
      ...action,
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.inMemoryAgentActions.unshift(fullAction);
    if (this.inMemoryAgentActions.length > 100) this.inMemoryAgentActions.pop();

    if (isConnected) {
      try {
        await AgentActionModel.create(fullAction);
      } catch (err) {
        console.error('[DB STORE] Mongo logAction error:', err);
      }
    }

    return fullAction;
  }

  async getActions(userId?: string): Promise<AgentAction[]> {
    if (isConnected) {
      try {
        const dbActions = await AgentActionModel.find().sort({ createdAt: -1 }).limit(100).lean();
        if (dbActions && dbActions.length > 0) {
          this.inMemoryAgentActions = dbActions as AgentAction[];
          return dbActions as AgentAction[];
        }
      } catch (err) {
        console.error('[DB STORE] Mongo getActions error:', err);
      }
    }
    return this.inMemoryAgentActions;
  }

  async getEmailSummary(emailId: string): Promise<string | undefined> {
    if (this.inMemoryEmailSummaries.has(emailId)) {
      return this.inMemoryEmailSummaries.get(emailId);
    }
    if (isConnected) {
      try {
        const doc = await EmailSummaryModel.findOne({ emailId } as any).lean();
        if (doc && (doc as any).summary) {
          const summary = (doc as any).summary as string;
          this.inMemoryEmailSummaries.set(emailId, summary);
          return summary;
        }
      } catch (err) {
        console.error('[DB STORE] Mongo getEmailSummary error:', err);
      }
    }
    return undefined;
  }

  async saveEmailSummary(emailId: string, summary: string): Promise<string> {
    this.inMemoryEmailSummaries.set(emailId, summary);
    if (isConnected) {
      try {
        await EmailSummaryModel.findOneAndUpdate(
          { emailId } as any,
          { emailId, summary, createdAt: new Date().toISOString() },
          { upsert: true, new: true }
        );
        console.log(`[DB STORE] Saved AI summary for email ${emailId} to MongoDB.`);
      } catch (err) {
        console.error('[DB STORE] Mongo saveEmailSummary error:', err);
      }
    }
    return summary;
  }

  getTemplates(): EmailTemplate[] {
    return Array.from(this.inMemoryTemplates.values());
  }

  getTemplateById(id: string): EmailTemplate | undefined {
    return this.inMemoryTemplates.get(id);
  }

  async saveTemplate(template: Partial<EmailTemplate> & { name: string; htmlContent: string }): Promise<EmailTemplate> {
    const id = template.id || `tpl-custom-${Date.now()}`;
    const newTemplate: EmailTemplate = {
      id,
      name: template.name,
      description: template.description || 'Custom HTML Email Template',
      category: template.category || 'custom',
      subjectTemplate: template.subjectTemplate || '{{subject}}',
      htmlContent: template.htmlContent,
      isBuiltIn: false,
      createdAt: new Date().toISOString()
    };

    this.inMemoryTemplates.set(id, newTemplate);

    if (isConnected) {
      try {
        await EmailTemplateModel.findOneAndUpdate({ id } as any, newTemplate, { upsert: true, new: true });
        console.log(`[DB STORE] Saved custom HTML template ${id} to MongoDB.`);
      } catch (err) {
        console.error('[DB STORE] Mongo saveTemplate error:', err);
      }
    }

    return newTemplate;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const existing = this.inMemoryTemplates.get(id);
    if (existing?.isBuiltIn) {
      throw new Error('Cannot delete built-in template');
    }
    this.inMemoryTemplates.delete(id);
    if (isConnected) {
      try {
        await EmailTemplateModel.deleteOne({ id } as any);
      } catch (err) {
        console.error('[DB STORE] Mongo deleteTemplate error:', err);
      }
    }
    return true;
  }

  // MongoDB Memory Store Methods
  private inMemoryMemories: Map<string, any> = new Map();

  async saveMemory(userId: string, key: string, value: any, category: string = 'preference'): Promise<any> {
    const memKey = `${userId}:${key}`;
    const memObj = { userId, key, value, category, updatedAt: new Date().toISOString() };
    this.inMemoryMemories.set(memKey, memObj);

    if (isConnected) {
      try {
        await AgentMemoryModel.findOneAndUpdate(
          { userId, key } as any,
          memObj,
          { upsert: true, new: true }
        );
        console.log(`[DB STORE] Saved agent memory [${key}] for user ${userId} to MongoDB.`);
      } catch (err) {
        console.error('[DB STORE] Mongo saveMemory error:', err);
      }
    }
    return memObj;
  }

  async getMemory(userId: string, key: string): Promise<any | null> {
    const memKey = `${userId}:${key}`;
    if (this.inMemoryMemories.has(memKey)) {
      return this.inMemoryMemories.get(memKey);
    }

    if (isConnected) {
      try {
        const mem = await AgentMemoryModel.findOne({ userId, key } as any).lean();
        if (mem) {
          this.inMemoryMemories.set(memKey, mem);
          return mem;
        }
      } catch (err) {
        console.error('[DB STORE] Mongo getMemory error:', err);
      }
    }
    return null;
  }

  async getAllMemories(userId: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    if (isConnected) {
      try {
        const dbMems = await AgentMemoryModel.find({ userId } as any).lean();
        for (const m of dbMems) {
          result[(m as any).key] = (m as any).value;
          this.inMemoryMemories.set(`${userId}:${(m as any).key}`, m);
        }
        return result;
      } catch (err) {
        console.error('[DB STORE] Mongo getAllMemories error:', err);
      }
    }

    for (const [mk, mv] of this.inMemoryMemories.entries()) {
      if (mk.startsWith(`${userId}:`)) {
        result[mv.key] = mv.value;
      }
    }

    return result;
  }

  // Important Senders Management Methods
  async getImportantSenders(userId: string = 'demo-user'): Promise<string[]> {
    const mem = await this.getMemory(userId, 'important_senders');
    if (mem && Array.isArray(mem.value)) {
      return mem.value;
    }
    // Default demo important senders if none stored yet
    return ['ahmed@techcorp.io'];
  }

  async addImportantSender(userId: string = 'demo-user', senderEmail: string): Promise<string[]> {
    const current = await this.getImportantSenders(userId);
    const normalized = senderEmail.trim().toLowerCase();
    if (normalized && !current.includes(normalized)) {
      const updated = [...current, normalized];
      await this.saveMemory(userId, 'important_senders', updated, 'preference');
      return updated;
    }
    return current;
  }

  async removeImportantSender(userId: string = 'demo-user', senderEmail: string): Promise<string[]> {
    const current = await this.getImportantSenders(userId);
    const normalized = senderEmail.trim().toLowerCase();
    const updated = current.filter(s => s !== normalized);
    await this.saveMemory(userId, 'important_senders', updated, 'preference');
    return updated;
  }

  async toggleImportantSender(userId: string = 'demo-user', senderEmail: string): Promise<{ senders: string[]; isImportant: boolean }> {
    const current = await this.getImportantSenders(userId);
    const normalized = senderEmail.trim().toLowerCase();
    let isImportant = false;
    let updated: string[];

    if (current.includes(normalized)) {
      updated = current.filter(s => s !== normalized);
      isImportant = false;
    } else {
      updated = [...current, normalized];
      isImportant = true;
    }
    await this.saveMemory(userId, 'important_senders', updated, 'preference');
    return { senders: updated, isImportant };
  }
}

export const dbStore = new DatabaseStore();

// Mongoose Connection Helper
export async function connectMongoDB(): Promise<boolean> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('[DB] MONGODB_URI not set. Operating with in-memory database engine.');
    return false;
  }

  try {
    if (!isConnected) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      isConnected = true;
      console.log('[DB] MongoDB connected successfully.');
      await dbStore.syncFromMongoDB();
    }
    return true;
  } catch (err) {
    console.error('[DB] MongoDB connection failed. Falling back to in-memory store:', err);
    return false;
  }
}

