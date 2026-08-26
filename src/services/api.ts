import { User, EmailMessage, EmailThread, Conversation, AgentAction, DraftReply, EmailTemplate } from '../types';

let cachedAccessToken: string | null = null;

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
  if (token) {
    sessionStorage.setItem('gmail_access_token', token);
  } else {
    sessionStorage.removeItem('gmail_access_token');
  }
}

export function getCachedAccessToken(): string | null {
  if (!cachedAccessToken) {
    cachedAccessToken = sessionStorage.getItem('gmail_access_token');
  }
  return cachedAccessToken;
}

function getAuthHeaders(): HeadersInit {
  const token = getCachedAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function safeParseJson(res: Response, defaultError: string = 'Request failed'): Promise<any> {
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`${defaultError}: Server returned non-JSON response (${res.status} ${res.statusText})`);
  }
  return data;
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<{ user: User | null }> {
    const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
    return res.json();
  },

  async signup(payload: { username: string; email: string; password?: string }): Promise<{ success: boolean; message: string; user?: User; token?: string; verificationUrl?: string; expiresAt?: string; error?: string }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return safeParseJson(res, 'Signup failed');
  },

  async login(payload: { email: string; password?: string }): Promise<{ success: boolean; user?: User; sessionToken?: string; isUnverified?: boolean; message?: string; error?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return safeParseJson(res, 'Login failed');
  },

  async verifyEmail(token: string): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
    const res = await fetch(`/api/verify?token=${encodeURIComponent(token)}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    return safeParseJson(res, 'Email verification failed');
  },

  async getGoogleAuthUrl(): Promise<string> {
    const res = await fetch('/api/auth/google');
    const data = await safeParseJson(res, 'Failed to fetch Google Auth URL');
    if (!data.url) throw new Error(data.error?.message || 'Failed to get OAuth URL');
    return data.url;
  },

  // Emails
  async getEmails(query: string = '', maxResults: number = 20): Promise<EmailMessage[]> {
    const url = `/api/emails?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.emails || [];
  },

  async getUnreadEmails(): Promise<EmailMessage[]> {
    const res = await fetch('/api/emails/unread', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.emails || [];
  },

  async getEmailById(id: string): Promise<EmailMessage> {
    const res = await fetch(`/api/emails/${id}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load email');
    return data.email;
  },

  async getThread(id: string): Promise<EmailThread> {
    const res = await fetch(`/api/emails/${id}/thread`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.thread;
  },

  async markAsRead(id: string): Promise<boolean> {
    const res = await fetch(`/api/emails/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.success;
  },

  async archiveEmail(id: string): Promise<boolean> {
    const res = await fetch(`/api/emails/${id}/archive`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.success;
  },

  async toggleStarEmail(messageId: string, isStarred?: boolean): Promise<EmailMessage> {
    const res = await fetch(`/api/emails/${messageId}/star`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isStarred })
    });
    const data = await res.json();
    return data.email;
  },

  async markSpam(messageId: string): Promise<boolean> {
    const res = await fetch(`/api/emails/${messageId}/spam`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.success;
  },

  async scheduleEmail(payload: { to: string; subject: string; body: string; scheduledAt: string }): Promise<EmailMessage> {
    const res = await fetch('/api/emails/schedule', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await safeParseJson(res, 'Failed to schedule email');
    if (!data.success) throw new Error(data.error || 'Failed to schedule email');
    return data.email;
  },

  async aiWriteEmail(payload: { prompt: string; to?: string; subject?: string; tone?: string; body?: string }): Promise<{ subject: string; body: string }> {
    const res = await fetch('/api/emails/ai-write', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await safeParseJson(res, 'Failed to generate email content with AI');
    if (!data.success) throw new Error(data.error || 'Failed to generate email content with AI');
    return { subject: data.subject, body: data.body };
  },

  async getEmailSummary(id: string): Promise<string | null> {
    const res = await fetch(`/api/emails/${id}/summary`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.summary || null;
  },

  async summarizeEmail(id: string, details: { subject: string; sender: string; body: string }): Promise<string> {
    const res = await fetch(`/api/emails/${id}/summarize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(details)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to generate summary');
    return data.summary;
  },

  // Email Templates
  async getTemplates(): Promise<EmailTemplate[]> {
    const res = await fetch('/api/templates', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.templates || [];
  },

  async getTemplateById(id: string): Promise<EmailTemplate> {
    const res = await fetch(`/api/templates/${id}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Template not found');
    return data.template;
  },

  async saveTemplate(template: Partial<EmailTemplate> & { name: string; htmlContent: string }): Promise<EmailTemplate> {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(template)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to save template');
    return data.template;
  },

  async deleteTemplate(id: string): Promise<boolean> {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete template');
    return true;
  },

  async generateAiTemplate(prompt: string): Promise<string> {
    const res = await fetch('/api/templates/generate-ai', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to generate template with AI');
    return data.htmlContent;
  },

  async renderTemplate(templateId?: string, htmlContent?: string, dataFields?: Record<string, any>): Promise<string> {
    const res = await fetch('/api/templates/render', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ templateId, htmlContent, data: dataFields })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to render template');
    return data.renderedHtml;
  },

  // AI Agent Chat
  async sendAgentChat(message: string, conversationId?: string): Promise<{
    reply: string;
    conversationId: string;
    toolsExecuted: any[];
    draft?: DraftReply;
  }> {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, conversationId })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || data.error || 'AI Agent interaction failed');
    }
    return data;
  },

  async getConversations(): Promise<Conversation[]> {
    const res = await fetch('/api/agent/conversations', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.conversations || [];
  },

  async getAgentActions(): Promise<AgentAction[]> {
    const res = await fetch('/api/agent/actions', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.actions || [];
  },

  // Draft & Send Email (Human-in-the-loop approved)
  async draftReply(messageId: string, instructions: string): Promise<DraftReply> {
    const res = await fetch('/api/emails/draft-reply', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ messageId, instructions })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create draft');
    return data.draft;
  },

  async sendEmail(payload: { to: string; subject: string; body: string; threadId?: string; isHtml?: boolean; userApproved?: boolean }) {
    const res = await fetch('/api/emails/send', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await safeParseJson(res, 'Failed to send email');
    if (!data.success) throw new Error(data.error?.message || data.error || 'Failed to send email');
    return data;
  },

  // Important Senders API
  async getImportantSenders(): Promise<string[]> {
    const res = await fetch('/api/important-senders', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.senders || [];
  },

  async addImportantSender(email: string): Promise<string[]> {
    const res = await fetch('/api/important-senders', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to add important sender');
    return data.senders;
  },

  async toggleImportantSender(email: string): Promise<{ isImportant: boolean; senders: string[] }> {
    const res = await fetch('/api/important-senders/toggle', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to toggle important sender');
    return data;
  },

  async removeImportantSender(email: string): Promise<string[]> {
    const res = await fetch('/api/important-senders', {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to remove important sender');
    return data.senders;
  }
};
