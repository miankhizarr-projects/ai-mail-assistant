import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { connectMongoDB, dbStore } from './server/models/db';
import { gmailService } from './server/services/gmail.service';
import { runAgentLoop, generateEmailSummaryDirect, generateHtmlTemplateDirect, generateEmailWriterDirect } from './server/agent/agent';
import { ALL_AGENT_SKILLS } from './server/agent/skills';

// Initialize DB Connection safely
connectMongoDB().catch(err => console.error('[DB Init Error]:', err));

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Extract Authorization Bearer token from headers
function getBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// -------------------------------------------------------------
// 1. AUTHENTICATION & VERIFICATION ENDPOINTS
// -------------------------------------------------------------

// Sign Up endpoint
const handleSignup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email, and password are required.' });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const result = await dbStore.createUser({ username, email, password }, baseUrl);

    res.json({
      success: true,
      message: 'Registration successful! Verification email sent.',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        username: result.user.username,
        isVerified: result.user.isVerified
      },
      token: result.token,
      verificationUrl: result.verificationUrl,
      expiresAt: result.expiresAt
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

app.post('/api/auth/signup', handleSignup);
app.post('/auth/signup', handleSignup);

// Log In endpoint
const handleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await dbStore.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.password && user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        isUnverified: true,
        email: user.email,
        message: 'Account not verified. Please check your email for the verification link (expires in 15 mins).'
      });
    }

    res.json({
      success: true,
      user,
      sessionToken: user.id
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

app.post('/api/auth/login', handleLogin);
app.post('/auth/login', handleLogin);

// Verification Endpoint - Handles GET /api/verify?token=... and GET /verify?token=...
const handleVerifyToken = async (req: Request, res: Response) => {
  const token = (req.query.token as string) || (req.body.token as string);
  console.log(`[AUTH] Verification request for token: ${token}`);

  const result = await dbStore.verifyUserToken(token);

  if (req.accepts('html') && !req.xhr && req.headers['sec-fetch-dest'] === 'document') {
    if (result.success && result.user) {
      // Auto redirect to dashboard page
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verified - AI Mail Assistant</title>
          <meta http-equiv="refresh" content="2;url=/?verified=true&userId=${result.user.id}">
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; border: 1px solid #334155; padding: 40px; border-radius: 16px; text-align: center; max-width: 440px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            h1 { color: #10b981; font-size: 24px; margin-bottom: 12px; }
            p { color: #94a3b8; line-height: 1.5; font-size: 15px; }
            .btn { display: inline-block; margin-top: 20px; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✓ Email Verified!</h1>
            <p>Your account (<strong>${result.user.email}</strong>) has been successfully activated.</p>
            <p>Redirecting you to the AI Mail Assistant dashboard...</p>
            <a href="/?verified=true&userId=${result.user.id}" class="btn">Open Dashboard Now</a>
          </div>
        </body>
        </html>
      `);
    } else {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed - AI Mail Assistant</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; border: 1px solid #f43f5e; padding: 40px; border-radius: 16px; text-align: center; max-width: 440px; }
            h1 { color: #f43f5e; font-size: 22px; margin-bottom: 12px; }
            p { color: #94a3b8; line-height: 1.5; font-size: 14px; }
            .btn { display: inline-block; margin-top: 20px; background: #334155; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Verification Link Invalid or Expired</h1>
            <p>${result.error || 'Token not found or 15-minute verification window expired.'}</p>
            <a href="/" class="btn">Back to Login / Landing Page</a>
          </div>
        </body>
        </html>
      `);
    }
  }

  if (result.success && result.user) {
    return res.json({
      success: true,
      user: result.user,
      message: 'Email verified successfully. You can now access your dashboard.'
    });
  } else {
    return res.status(400).json({
      success: false,
      error: result.error || 'Verification failed.'
    });
  }
};

app.get('/api/verify', handleVerifyToken);
app.post('/api/verify', handleVerifyToken);
app.get('/verify', handleVerifyToken);

// Get current user profile and Gmail auth state
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.json({ user: null });
  }

  // Check if token corresponds to a registered email/password user
  const dbUser = await dbStore.getUserById(token);
  if (dbUser && dbUser.isVerified) {
    return res.json({ user: dbUser });
  }

  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (userInfoRes.ok) {
      const googleInfo = await userInfoRes.json();
      const user = await dbStore.getOrCreateUser(
        googleInfo.email,
        googleInfo.name || googleInfo.email.split('@')[0]
      );
      if (googleInfo.picture) user.picture = googleInfo.picture;
      if (googleInfo.id) user.googleId = googleInfo.id;
      user.isVerified = true;
      user.isConnectedToGmail = true;
      await dbStore.saveUser(user);

      return res.json({
        user: {
          ...user,
          isConnectedToGmail: true
        }
      });
    }
  } catch (err) {
    console.warn('[AUTH] Could not fetch Google userinfo:', err);
  }

  res.json({ user: null });
});

// Robust Redirect URI Resolution Helper
function getRedirectUri(req: Request): string {
  if (process.env.APP_URL) {
    const cleanAppUrl = process.env.APP_URL.replace(/\/+$/, '');
    return `${cleanAppUrl}/auth/callback`;
  }

  const hostRaw = (req.get ? req.get('host') : (req.headers?.host || 'localhost:3000')) || 'localhost:3000';
  const host = hostRaw.split(',')[0].trim();

  let protocolRaw = (req.headers['x-forwarded-proto'] as string || req.protocol || 'https');
  let protocol = protocolRaw.split(',')[0].trim();

  if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    protocol = 'https';
  }

  return `${protocol}://${host}/auth/callback`;
}

// Construct Google OAuth URL
const handleGoogleAuthUrl = (req: Request, res: Response) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = getRedirectUri(req);
    console.log(`[OAUTH] Generated Google Auth URL redirect_uri: ${redirectUri}`);

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'GOOGLE_CLIENT_ID_MISSING',
          message: 'GOOGLE_CLIENT_ID environment variable is missing in Vercel Project Settings.'
        }
      });
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.json({ url: authUrl });
  } catch (err: any) {
    console.error('[Google Auth URL Handler Error]:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'OAUTH_URL_ERROR',
        message: err?.message || 'Error constructing Google OAuth URL'
      }
    });
  }
};

app.get('/api/auth/google', handleGoogleAuthUrl);
app.get('/auth/google', handleGoogleAuthUrl);

// OAuth Callback
app.get(['/auth/callback', '/auth/callback/', '/api/auth/callback'], async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getRedirectUri(req);
    console.log(`[OAUTH] Exchanging OAuth code with redirect_uri: ${redirectUri}`);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      console.log('[AUTH] Successfully exchanged Google OAuth code for tokens!');
      
      // Return postMessage HTML to close popup and pass token to opener
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Successful</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h2>Gmail Connected Successfully!</h2>
            <p>Closing this window...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  accessToken: ${JSON.stringify(tokenData.access_token)}
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`Token exchange failed: ${JSON.stringify(tokenData)}`);
    }
  } catch (err: any) {
    console.error('[AUTH] Callback error:', err);
    res.status(500).send(`Authentication error: ${err.message}`);
  }
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// 2. GMAIL ENDPOINTS
// -------------------------------------------------------------

// List & Search Emails
app.get('/api/emails', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const query = (req.query.q as string) || '';
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const user = await dbStore.getOrCreateUser();

    const emails = await gmailService.searchEmails(token, query, maxResults, user.id);
    res.json({ success: true, count: emails.length, emails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Unread Emails
app.get('/api/emails/unread', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const user = await dbStore.getOrCreateUser();
    const emails = await gmailService.searchEmails(token, 'is:unread', maxResults, user.id);
    res.json({ success: true, count: emails.length, emails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Single Email
app.get('/api/emails/:id', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const user = await dbStore.getOrCreateUser();
    const email = await gmailService.getEmail(token, req.params.id, user.id);
    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }
    res.json({ success: true, email });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Star/Unstar Email
app.post('/api/emails/:id/star', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { isStarred } = req.body;
    const email = await gmailService.toggleStar(token, req.params.id, isStarred);
    res.json({ success: true, email });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark Email as Spam
app.post('/api/emails/:id/spam', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    await gmailService.markAsSpam(token, req.params.id);
    res.json({ success: true, message: 'Email moved to spam' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Schedule Email
app.post('/api/emails/schedule', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { to, subject, body, scheduledAt } = req.body;
    if (!to || !subject || !body || !scheduledAt) {
      return res.status(400).json({ success: false, error: 'to, subject, body, and scheduledAt are required' });
    }
    const scheduledEmail = await gmailService.scheduleEmail(token, { to, subject, body, scheduledAt });
    res.json({ success: true, email: scheduledEmail });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Email Writer assistant
app.post('/api/emails/ai-write', async (req: Request, res: Response) => {
  try {
    const { prompt, to, subject, tone, body } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }
    const result = await generateEmailWriterDirect(prompt, { to, subject, tone, existingBody: body });
    res.json({ success: true, subject: result.subject, body: result.body });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Important Senders Endpoints
app.get('/api/important-senders', async (req: Request, res: Response) => {
  try {
    const user = await dbStore.getOrCreateUser();
    const senders = await dbStore.getImportantSenders(user.id);
    res.json({ success: true, senders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/important-senders', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const user = await dbStore.getOrCreateUser();
    const senders = await dbStore.addImportantSender(user.id, email);
    res.json({ success: true, senders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/important-senders/toggle', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const user = await dbStore.getOrCreateUser();
    const result = await dbStore.toggleImportantSender(user.id, email);
    res.json({ success: true, isImportant: result.isImportant, senders: result.senders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/important-senders', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const user = await dbStore.getOrCreateUser();
    const senders = await dbStore.removeImportantSender(user.id, email);
    res.json({ success: true, senders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Thread
app.get('/api/emails/:id/thread', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const thread = await gmailService.getThread(token, req.params.id);
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    res.json({ success: true, thread });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark Email Read
app.post('/api/emails/:id/read', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    await gmailService.markAsRead(token, req.params.id);
    res.json({ success: true, message: 'Email marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Archive Email
app.post('/api/emails/:id/archive', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    await gmailService.archiveEmail(token, req.params.id);
    res.json({ success: true, message: 'Email archived' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get AI Summary for Email
app.get('/api/emails/:id/summary', async (req: Request, res: Response) => {
  try {
    const emailId = req.params.id;
    const summary = await dbStore.getEmailSummary(emailId);
    res.json({ success: true, summary: summary || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate and Save AI Summary for Email (without creating a chat conversation)
app.post('/api/emails/:id/summarize', async (req: Request, res: Response) => {
  try {
    const emailId = req.params.id;
    const { subject, sender, body } = req.body;

    if (!body && !subject) {
      return res.status(400).json({ success: false, error: 'Email content required' });
    }

    const summary = await generateEmailSummaryDirect(
      subject || 'No Subject',
      sender || 'Unknown Sender',
      body || ''
    );

    await dbStore.saveEmailSummary(emailId, summary);
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 2.5 EMAIL TEMPLATE ENDPOINTS
// -------------------------------------------------------------

// Get All Email Templates
app.get('/api/templates', async (req: Request, res: Response) => {
  try {
    const templates = dbStore.getTemplates();
    res.json({ success: true, templates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Template By ID
app.get('/api/templates/:id', async (req: Request, res: Response) => {
  try {
    const template = dbStore.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create or Update Custom Email Template
app.post('/api/templates', async (req: Request, res: Response) => {
  try {
    const { id, name, description, category, subjectTemplate, htmlContent } = req.body;
    if (!name || !htmlContent) {
      return res.status(400).json({ success: false, error: 'Template name and HTML content required' });
    }

    const saved = await dbStore.saveTemplate({
      id,
      name,
      description,
      category,
      subjectTemplate,
      htmlContent
    });

    res.json({ success: true, template: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Custom Email Template
app.delete('/api/templates/:id', async (req: Request, res: Response) => {
  try {
    await dbStore.deleteTemplate(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// AI Generate HTML Email Template
app.post('/api/templates/generate-ai', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const htmlContent = await generateHtmlTemplateDirect(prompt);
    res.json({ success: true, htmlContent });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Render Email Template with variables
app.post('/api/templates/render', async (req: Request, res: Response) => {
  try {
    const { templateId, htmlContent, data } = req.body;
    let templateHtml = htmlContent;

    if (!templateHtml && templateId) {
      const tpl = dbStore.getTemplateById(templateId);
      if (tpl) templateHtml = tpl.htmlContent;
    }

    if (!templateHtml) {
      return res.status(400).json({ success: false, error: 'Template HTML content required' });
    }

    const d = data || {};
    let rendered = templateHtml
      .replace(/\{\{\s*recipientName\s*\}\}/g, d.recipientName || 'Valued Recipient')
      .replace(/\{\{\s*subject\s*\}\}/g, d.subject || 'Important Message')
      .replace(/\{\{\s*bodyContent\s*\}\}/g, (d.bodyContent || '').replace(/\n/g, '<br/>'))
      .replace(/\{\{\s*ctaText\s*\}\}/g, d.ctaText || 'View Details')
      .replace(/\{\{\s*ctaLink\s*\}\}/g, d.ctaLink || '#')
      .replace(/\{\{\s*senderName\s*\}\}/g, d.senderName || 'AI Assistant');

    res.json({ success: true, renderedHtml: rendered });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. AI AGENT ENDPOINTS
// -------------------------------------------------------------

// Chat with AI Mail Assistant
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    const user = await dbStore.getOrCreateUser();

    const result = await runAgentLoop({
      userId: user.id,
      conversationId,
      userMessage: message,
      accessToken: token
    });

    res.json({
      success: true,
      reply: result.reply,
      conversationId: result.conversationId,
      toolsExecuted: result.toolsExecuted,
      draft: result.draft
    });
  } catch (err: any) {
    console.error('[API AGENT CHAT] Error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_CHAT_FAILED',
        message: err.message || 'An error occurred during AI agent interaction.'
      }
    });
  }
});

// List Conversations
app.get('/api/agent/conversations', async (req: Request, res: Response) => {
  try {
    const user = await dbStore.getOrCreateUser();
    const conversations = await dbStore.getConversations(user.id);
    res.json({ success: true, conversations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Single Conversation
app.get('/api/agent/conversations/:id', async (req: Request, res: Response) => {
  try {
    const conv = await dbStore.getConversationById(req.params.id);
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, conversation: conv });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Agent Skills
app.get('/api/agent/skills', (req: Request, res: Response) => {
  res.json({
    success: true,
    skills: ALL_AGENT_SKILLS.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      triggerKeywords: s.triggerKeywords,
      recommendedTools: s.recommendedTools
    }))
  });
});

// Get User MongoDB Agent Memory
app.get('/api/agent/memory', async (req: Request, res: Response) => {
  try {
    const user = await dbStore.getOrCreateUser();
    const memory = await dbStore.getAllMemories(user.id);
    res.json({ success: true, memory });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Key-Value Memory to MongoDB
app.post('/api/agent/memory', async (req: Request, res: Response) => {
  try {
    const { key, value, category } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, error: 'Key and value are required' });
    }
    const user = await dbStore.getOrCreateUser();
    const saved = await dbStore.saveMemory(user.id, key, value, category);
    res.json({ success: true, memory: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Agent Activity Logs
app.get('/api/agent/actions', async (req: Request, res: Response) => {
  try {
    const actions = await dbStore.getActions();
    res.json({ success: true, actions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. DRAFT & SEND ENDPOINTS (Human-In-The-Loop)
// -------------------------------------------------------------

// Generate Draft Reply
app.post('/api/emails/draft-reply', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { messageId, instructions } = req.body;

    if (!messageId || !instructions) {
      return res.status(400).json({ success: false, error: 'messageId and instructions are required.' });
    }

    const draft = await gmailService.draftReply(token, messageId, instructions);
    res.json({ success: true, draft });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send Approved Email
app.post('/api/emails/send', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const { to, subject, body, threadId, userApproved = true } = req.body;

    if (userApproved === false) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_APPROVAL_REQUIRED',
          message: 'Explicit user approval is required to send emails.'
        }
      });
    }

    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, error: 'Recipient, subject, and body are required.' });
    }

    const result = await gmailService.sendEmail(token, { to, subject, body, threadId });
    
    // Log Agent Action
    await dbStore.logAction({
      userId: 'demo-user',
      tool: 'send_email',
      input: { to, subject, body, threadId },
      output: result,
      status: result.success ? 'completed' : 'error'
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. VITE / STATIC MIDDLEWARE SETUP & ERROR HANDLING
// -------------------------------------------------------------
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Internal Server Error'
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Mail Assistant AI Agent running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
