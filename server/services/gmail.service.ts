import { EmailMessage, EmailThread, DraftReply } from '../../src/types';
import { dbStore, DEMO_EMAILS } from '../models/db';

// Convert HTML content into readable clean text
export function cleanHtmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Recursively extract text/plain and text/html parts from Gmail payload
 */
export function extractEmailBodyParts(payload: any): { html: string; text: string } {
  let html = '';
  let text = '';

  function traverse(part: any) {
    if (!part) return;

    if (part.mimeType === 'text/html' && part.body?.data && !html) {
      try {
        const base64 = part.body.data.replace(/-/g, '+').replace(/_/g, '/');
        html = Buffer.from(base64, 'base64').toString('utf-8');
      } catch (e) {
        console.warn('[GMAIL] Failed to decode html body:', e);
      }
    } else if (part.mimeType === 'text/plain' && part.body?.data && !text) {
      try {
        const base64 = part.body.data.replace(/-/g, '+').replace(/_/g, '/');
        text = Buffer.from(base64, 'base64').toString('utf-8');
      } catch (e) {
        console.warn('[GMAIL] Failed to decode text body:', e);
      }
    }

    if (part.parts && Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        traverse(subPart);
      }
    }
  }

  traverse(payload);
  return { html, text };
}

export class GmailService {
  /**
   * Helper to check if a sender string matches any user important sender
   */
  private isSenderImportant(sender: string, importantSenders: string[]): boolean {
    if (!sender || !importantSenders || importantSenders.length === 0) return false;
    const lowerSender = sender.toLowerCase();
    return importantSenders.some(imp => lowerSender.includes(imp.toLowerCase()));
  }

  /**
   * Search emails using Gmail query or filter cached inbox
   */
  async searchEmails(accessToken?: string, query: string = '', maxResults: number = 20, userId: string = 'demo-user'): Promise<EmailMessage[]> {
    console.log(`[GMAIL] Searching emails with query: "${query}", maxResults: ${maxResults}`);
    const importantSenders = await dbStore.getImportantSenders(userId);

    if (accessToken) {
      try {
        const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
        let effectiveQuery = query;

        // If query is checking for important emails, expand query to also search from important senders
        if (query.includes('is:important') && importantSenders.length > 0) {
          const senderQueries = importantSenders.map(s => `from:${s}`).join(' OR ');
          effectiveQuery = `(is:important OR ${senderQueries})`;
        }

        if (effectiveQuery) url.searchParams.append('q', effectiveQuery);
        url.searchParams.append('maxResults', maxResults.toString());

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.ok) {
          const data = await res.json();
          const messages = data.messages || [];

          // Fetch detail snippets for each message
          const emailList: EmailMessage[] = [];
          for (const msg of messages.slice(0, maxResults)) {
            const detail = await this.getEmail(accessToken, msg.id, userId);
            if (detail) {
              if (this.isSenderImportant(detail.sender, importantSenders)) {
                detail.isImportant = true;
                detail.category = 'important';
              }
              emailList.push(detail);
              dbStore.saveEmail(detail); // Cache in database
            }
          }
          return emailList;
        } else {
          console.warn(`[GMAIL] Gmail API search return status ${res.status}. Falling back to cached database.`);
        }
      } catch (err) {
        console.error('[GMAIL] Search API error:', err);
      }
    }

    // Fallback: search in-memory cached emails by query
    let allEmails = dbStore.getEmails();
    // Mark emails from important senders
    allEmails = allEmails.map(email => {
      if (this.isSenderImportant(email.sender, importantSenders)) {
        return { ...email, isImportant: true, category: 'important' as const };
      }
      return email;
    });

    if (!query) return allEmails.slice(0, maxResults);

    const q = query.toLowerCase();
    const filtered = allEmails.filter(email => {
      if (q.includes('is:unread') && email.isRead) return false;
      if (q.includes('is:important')) {
        return email.isImportant || this.isSenderImportant(email.sender, importantSenders);
      }
      if (q.includes('is:starred') || q.includes('label:starred')) {
        return email.isStarred || email.labels?.includes('STARRED') || email.category === 'starred';
      }
      if (q.includes('is:draft') || q.includes('label:draft')) {
        return email.isDraft || email.labels?.includes('DRAFT') || email.category === 'drafts';
      }
      if (q.includes('category:purchases') || q.includes('label:purchases') || q.includes('purchase')) {
        return (
          email.category === 'purchases' ||
          email.labels?.includes('PURCHASES') ||
          email.subject.toLowerCase().includes('order') ||
          email.subject.toLowerCase().includes('receipt') ||
          email.subject.toLowerCase().includes('invoice') ||
          email.subject.toLowerCase().includes('purchase') ||
          email.sender.toLowerCase().includes('amazon') ||
          email.sender.toLowerCase().includes('apple')
        );
      }
      if (q.includes('in:spam') || q.includes('is:spam')) {
        return email.isSpam || email.labels?.includes('SPAM') || email.category === 'spam';
      }
      if (q.includes('is:scheduled') || q.includes('label:scheduled') || q.includes('schedule')) {
        return email.isScheduled || email.labels?.includes('SCHEDULED') || email.category === 'scheduled';
      }
      if (q.includes('from:')) {
        const fromQuery = q.split('from:')[1]?.trim().split(' ')[0] || '';
        if (!email.sender.toLowerCase().includes(fromQuery)) return false;
      }
      return (
        email.subject.toLowerCase().includes(q) ||
        email.sender.toLowerCase().includes(q) ||
        email.snippet.toLowerCase().includes(q) ||
        email.body.toLowerCase().includes(q)
      );
    });

    return filtered.slice(0, maxResults);
  }

  /**
   * Retrieve complete content of a Gmail message
   */
  async getEmail(accessToken?: string, messageId?: string, userId: string = 'demo-user'): Promise<EmailMessage | null> {
    if (!messageId) return null;
    console.log(`[GMAIL] Fetching message details for ID: ${messageId}`);
    const importantSenders = await dbStore.getImportantSenders(userId);

    if (accessToken) {
      try {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.ok) {
          const msg = await res.json();
          const headers = msg.payload?.headers || [];
          const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          const subject = getHeader('Subject') || '(No Subject)';
          const sender = getHeader('From') || 'Unknown Sender';
          const toHeader = getHeader('To');
          const recipients = toHeader ? toHeader.split(',').map((s: string) => s.trim()) : [];
          const dateHeader = getHeader('Date') || new Date().toISOString();

          // Extract body text and html content
          const { html: extractedHtml, text: extractedText } = extractEmailBodyParts(msg.payload);
          const htmlBody = extractedHtml || undefined;
          const body = extractedText || (extractedHtml ? cleanHtmlToText(extractedHtml) : msg.snippet || '');

          const labels = msg.labelIds || [];
          const isRead = !labels.includes('UNREAD');
          const isImportant = labels.includes('IMPORTANT') || this.isSenderImportant(sender, importantSenders);

          const emailObj: EmailMessage = {
            id: msg.id,
            threadId: msg.threadId,
            sender,
            recipients,
            subject,
            snippet: msg.snippet || body.substring(0, 120),
            body,
            htmlBody,
            date: new Date(dateHeader).toISOString(),
            labels,
            isRead,
            isImportant,
            category: isImportant ? 'important' : undefined
          };

          dbStore.saveEmail(emailObj);
          return emailObj;
        }
      } catch (err) {
        console.error('[GMAIL] Get message error:', err);
      }
    }

    // Return cached/demo email if found
    const cached = dbStore.getEmailById(messageId);
    if (cached) {
      if (this.isSenderImportant(cached.sender, importantSenders)) {
        cached.isImportant = true;
        cached.category = 'important';
      }
    }
    return cached || null;
  }

  /**
   * Retrieve conversation thread
   */
  async getThread(accessToken?: string, threadId?: string): Promise<EmailThread | null> {
    if (!threadId) return null;
    console.log(`[GMAIL] Fetching thread details for threadId: ${threadId}`);

    if (accessToken) {
      try {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.ok) {
          const thread = await res.json();
          const messages: EmailMessage[] = [];
          for (const msg of thread.messages || []) {
            const parsed = await this.getEmail(accessToken, msg.id);
            if (parsed) messages.push(parsed);
          }
          return {
            threadId,
            subject: messages[0]?.subject || 'Thread Conversation',
            messages
          };
        }
      } catch (err) {
        console.error('[GMAIL] Get thread error:', err);
      }
    }

    // Fallback: thread from db
    const allEmails = dbStore.getEmails();
    const threadMsgs = allEmails.filter(e => e.threadId === threadId);
    if (threadMsgs.length > 0) {
      return {
        threadId,
        subject: threadMsgs[0].subject,
        messages: threadMsgs
      };
    }

    return null;
  }

  /**
   * Return recent unread emails
   */
  async getUnreadEmails(accessToken?: string, maxResults: number = 20): Promise<EmailMessage[]> {
    return this.searchEmails(accessToken, 'is:unread', maxResults);
  }

  /**
   * Generate an email draft payload (does NOT send!)
   */
  async draftReply(accessToken: string | undefined, messageId: string, instructions: string): Promise<DraftReply> {
    console.log(`[GMAIL] Creating draft for message ${messageId} with instructions: "${instructions}"`);
    const email = await this.getEmail(accessToken, messageId);

    const senderEmail = email ? email.sender : 'ahmed@techcorp.io';
    const subject = email ? (email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`) : 'Re: Project Update';

    return {
      messageId,
      threadId: email?.threadId,
      to: senderEmail,
      subject,
      body: `Hi ${senderEmail.split(' ')[0]},\n\n${instructions}\n\nBest regards,`,
      inReplyTo: messageId
    };
  }

  /**
   * Send an approved email through Gmail API
   */
  async sendEmail(accessToken: string | undefined, payload: { to: string; subject: string; body: string; threadId?: string; isHtml?: boolean }): Promise<{ success: boolean; id?: string; message: string }> {
    console.log(`[GMAIL] Sending email to: ${payload.to}, Subject: "${payload.subject}", isHtml: ${!!payload.isHtml}`);

    const isHtml = payload.isHtml || /<[a-z][\s\S]*>/i.test(payload.body);
    const contentType = isHtml ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8';

    if (accessToken) {
      try {
        // Construct raw RFC 2822 email message
        const rawMessage = [
          `To: ${payload.to}`,
          `Subject: ${payload.subject}`,
          `Content-Type: ${contentType}`,
          `MIME-Version: 1.0`,
          ``,
          payload.body
        ].join('\r\n');

        const encodedMessage = Buffer.from(rawMessage)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const requestBody: any = { raw: encodedMessage };
        if (payload.threadId) requestBody.threadId = payload.threadId;

        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`[EMAIL] Successfully sent email via Gmail API! Message ID: ${data.id}`);
          return { success: true, id: data.id, message: 'Email sent successfully via Gmail!' };
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error('[EMAIL] Gmail send failed:', errData);
        }
      } catch (err) {
        console.error('[EMAIL] Send API error:', err);
      }
    }

    // Mock send confirmation in storage
    const sentEmail: EmailMessage = {
      id: 'sent-' + Date.now(),
      threadId: payload.threadId || 'thread-' + Date.now(),
      sender: 'Me <me@example.com>',
      recipients: [payload.to],
      subject: payload.subject,
      snippet: payload.body.substring(0, 100),
      body: payload.body,
      date: new Date().toISOString(),
      labels: ['SENT'],
      isRead: true
    };
    dbStore.saveEmail(sentEmail);

    return {
      success: true,
      id: sentEmail.id,
      message: 'Email processed and saved to Sent folder.'
    };
  }

  /**
   * Mark message as read
   */
  async markAsRead(accessToken: string | undefined, messageId: string): Promise<boolean> {
    console.log(`[GMAIL] Marking message ${messageId} as READ`);
    const email = dbStore.getEmailById(messageId);
    if (email) {
      email.isRead = true;
      email.labels = email.labels.filter(l => l !== 'UNREAD');
      dbStore.saveEmail(email);
    }

    if (accessToken) {
      try {
        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
        });
      } catch (err) {
        console.error('[GMAIL] Mark as read API error:', err);
      }
    }
    return true;
  }

  /**
   * Archive email
   */
  async archiveEmail(accessToken: string | undefined, messageId: string): Promise<boolean> {
    console.log(`[GMAIL] Archiving message ${messageId}`);
    const email = dbStore.getEmailById(messageId);
    if (email) {
      email.labels = email.labels.filter(l => l !== 'INBOX');
      dbStore.saveEmail(email);
    }

    if (accessToken) {
      try {
        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ removeLabelIds: ['INBOX'] })
        });
      } catch (err) {
        console.error('[GMAIL] Archive API error:', err);
      }
    }
    return true;
  }

  /**
   * Star / Unstar message
   */
  async toggleStar(accessToken: string | undefined, messageId: string, isStarred?: boolean): Promise<EmailMessage | null> {
    console.log(`[GMAIL] Toggling star for message ${messageId}`);
    const email = dbStore.getEmailById(messageId);
    if (!email) return null;

    const newStarred = isStarred !== undefined ? isStarred : !email.isStarred;
    email.isStarred = newStarred;
    if (newStarred) {
      if (!email.labels.includes('STARRED')) email.labels.push('STARRED');
    } else {
      email.labels = email.labels.filter(l => l !== 'STARRED');
    }
    dbStore.saveEmail(email);

    if (accessToken) {
      try {
        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            addLabelIds: newStarred ? ['STARRED'] : [],
            removeLabelIds: newStarred ? [] : ['STARRED']
          })
        });
      } catch (err) {
        console.error('[GMAIL] Toggle star API error:', err);
      }
    }
    return email;
  }

  /**
   * Mark message as Spam
   */
  async markAsSpam(accessToken: string | undefined, messageId: string): Promise<boolean> {
    console.log(`[GMAIL] Marking message ${messageId} as SPAM`);
    const email = dbStore.getEmailById(messageId);
    if (email) {
      email.isSpam = true;
      email.category = 'spam';
      email.labels = email.labels.filter(l => l !== 'INBOX');
      if (!email.labels.includes('SPAM')) email.labels.push('SPAM');
      dbStore.saveEmail(email);
    }

    if (accessToken) {
      try {
        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            addLabelIds: ['SPAM'],
            removeLabelIds: ['INBOX']
          })
        });
      } catch (err) {
        console.error('[GMAIL] Mark spam API error:', err);
      }
    }
    return true;
  }

  /**
   * Schedule email for future sending & store in connected Gmail account drafts
   */
  async scheduleEmail(
    accessToken: string | undefined,
    payload: { to: string; subject: string; body: string; scheduledAt: string }
  ): Promise<EmailMessage> {
    console.log(`[GMAIL] Scheduling email to ${payload.to} at ${payload.scheduledAt}`);

    let gmailDraftId: string | undefined;

    if (accessToken) {
      try {
        const scheduledTimeStr = new Date(payload.scheduledAt).toLocaleString();
        const rawMessage = [
          `To: ${payload.to}`,
          `Subject: ${payload.subject}`,
          `Content-Type: text/html; charset=utf-8`,
          `MIME-Version: 1.0`,
          ``,
          `<div style="font-family: sans-serif; padding: 12px; background: #f1f5f9; border-radius: 8px; margin-bottom: 16px; color: #334155;">`,
          `  <strong>⏰ Scheduled Delivery:</strong> This message is queued to be sent on <strong>${scheduledTimeStr}</strong>.`,
          `</div>`,
          `<div>${payload.body.replace(/\n/g, '<br/>')}</div>`
        ].join('\r\n');

        const encodedMessage = Buffer.from(rawMessage)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: { raw: encodedMessage }
          })
        });

        if (res.ok) {
          const draftData = await res.json();
          gmailDraftId = draftData.id;
          console.log(`[GMAIL] Successfully stored scheduled draft in Gmail connected account! Draft ID: ${gmailDraftId}`);
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn('[GMAIL] Could not post scheduled draft to Gmail API:', errData);
        }
      } catch (err) {
        console.error('[GMAIL] Schedule draft post error:', err);
      }
    }

    const scheduledEmail: EmailMessage = {
      id: gmailDraftId ? `draft-${gmailDraftId}` : 'scheduled-' + Date.now(),
      threadId: 'thread-' + Date.now(),
      sender: 'Me <me@example.com>',
      recipients: [payload.to],
      subject: payload.subject,
      snippet: `[Scheduled for ${new Date(payload.scheduledAt).toLocaleString()}] ` + payload.body.substring(0, 80),
      body: payload.body,
      date: new Date().toISOString(),
      labels: ['SCHEDULED', 'DRAFT'],
      isRead: true,
      isScheduled: true,
      scheduledAt: payload.scheduledAt,
      category: 'scheduled'
    };

    dbStore.saveEmail(scheduledEmail);
    return scheduledEmail;
  }
}

export const gmailService = new GmailService();
