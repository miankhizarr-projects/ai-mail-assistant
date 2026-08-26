import { gmailService } from '../services/gmail.service';
import { dbStore } from '../models/db';
import { generateHtmlTemplateDirect, generateEmailSummaryDirect } from './agent';

export const GMAIL_TOOLS_SCHEMA = [
  {
    type: 'function',
    function: {
      name: 'list_emails',
      description: 'Retrieve list of recent emails in the inbox.',
      parameters: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'number',
            description: 'Maximum number of emails to return (default: 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_email',
      description: 'Retrieve full details and readable body content of a specific Gmail message by ID.',
      parameters: {
        type: 'object',
        properties: {
          messageId: {
            type: 'string',
            description: 'The unique Gmail message ID'
          }
        },
        required: ['messageId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_emails',
      description: 'Search Gmail using query syntax (e.g., "from:ahmed", "is:unread", "project update").',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query string'
          },
          maxResults: {
            type: 'number',
            description: 'Max results (default: 10)'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_important_emails',
      description: 'Retrieve unread, high priority, or starred important emails requiring immediate attention.',
      parameters: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'number',
            description: 'Max results (default: 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_templates',
      description: 'Fetch all available HTML email templates from MongoDB store.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_template',
      description: 'Fetch a specific HTML email template by ID.',
      parameters: {
        type: 'object',
        properties: {
          templateId: {
            type: 'string',
            description: 'The template ID'
          }
        },
        required: ['templateId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_email_template',
      description: 'Create and persist a new custom HTML email template into MongoDB.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Template name'
          },
          description: {
            type: 'string',
            description: 'Short template description'
          },
          category: {
            type: 'string',
            description: 'Category (e.g. business, invitation, newsletter, custom)'
          },
          subjectTemplate: {
            type: 'string',
            description: 'Subject template format'
          },
          htmlContent: {
            type: 'string',
            description: 'Valid HTML email content with template variables'
          }
        },
        required: ['name', 'htmlContent']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'render_email_template',
      description: 'Render an HTML email template with customized fields data.',
      parameters: {
        type: 'object',
        properties: {
          templateId: {
            type: 'string',
            description: 'Template ID to render'
          },
          htmlContent: {
            type: 'string',
            description: 'Optional raw HTML template string'
          },
          recipientName: {
            type: 'string',
            description: 'Recipient full name'
          },
          subject: {
            type: 'string',
            description: 'Email subject'
          },
          bodyContent: {
            type: 'string',
            description: 'Main body message content'
          },
          ctaText: {
            type: 'string',
            description: 'Call to action button text'
          },
          ctaLink: {
            type: 'string',
            description: 'Call to action URL'
          },
          senderName: {
            type: 'string',
            description: 'Sender name'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'summarize_email',
      description: 'Generate a structured AI summary for an email message.',
      parameters: {
        type: 'object',
        properties: {
          messageId: {
            type: 'string',
            description: 'The message ID to summarize'
          }
        },
        required: ['messageId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'extract_email_tasks',
      description: 'Extract actionable items, deadlines, and responsibilities from an email.',
      parameters: {
        type: 'object',
        properties: {
          messageId: {
            type: 'string',
            description: 'The email message ID'
          }
        },
        required: ['messageId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'draft_reply',
      description: 'Generate an email draft reply for a specific message. Does NOT send immediately.',
      parameters: {
        type: 'object',
        properties: {
          messageId: {
            type: 'string',
            description: 'The message ID to reply to'
          },
          instructions: {
            type: 'string',
            description: 'Instructions on what to reply'
          },
          templateId: {
            type: 'string',
            description: 'Optional HTML template ID to use for reply formatting'
          }
        },
        required: ['messageId', 'instructions']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Dispatch an email directly to a recipient.',
      parameters: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address'
          },
          subject: {
            type: 'string',
            description: 'Email subject'
          },
          body: {
            type: 'string',
            description: 'Email body text or HTML'
          },
          isHtml: {
            type: 'boolean',
            description: 'Whether body is HTML'
          },
          userApproved: {
            type: 'boolean',
            description: 'Must be true to confirm explicit user approval'
          }
        },
        required: ['to', 'subject', 'body', 'userApproved']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: 'Save user preference, entity detail, or learned context persistently into MongoDB memory.',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Memory key name (e.g. "signature", "preferred_tone", "frequent_contact")'
          },
          value: {
            type: 'string',
            description: 'Memory content string or JSON'
          },
          category: {
            type: 'string',
            description: 'Memory category (e.g. preference, contact, task_rule)'
          }
        },
        required: ['key', 'value']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_memory',
      description: 'Retrieve user preference or context stored in MongoDB agent memory.',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Memory key to retrieve'
          }
        },
        required: ['key']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mark_as_read',
      description: 'Mark an email message as read.',
      parameters: {
        type: 'object',
        properties: {
          messageId: {
            type: 'string',
            description: 'The message ID to mark as read'
          }
        },
        required: ['messageId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'archive_email',
      description: 'Archive an email message (remove from INBOX).',
      parameters: {
        type: 'object',
        properties: {
          messageId: {
            type: 'string',
            description: 'The message ID to archive'
          }
        },
        required: ['messageId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mark_sender_important',
      description: 'Mark or unmark an email sender/user as an Important VIP user so their emails automatically appear in the Important folder.',
      parameters: {
        type: 'object',
        properties: {
          senderEmail: {
            type: 'string',
            description: 'The email address of the user (e.g. "ahmed@techcorp.io")'
          },
          isImportant: {
            type: 'boolean',
            description: 'True to mark as important, false to remove from important senders'
          }
        },
        required: ['senderEmail']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_important_senders',
      description: 'Get the list of all email users/senders currently marked as Important (VIPs).',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_starred_emails',
      description: 'Get all starred email messages.',
      parameters: {
        type: 'object',
        properties: {
          maxResults: { type: 'number', description: 'Maximum emails to return' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_draft_emails',
      description: 'Get all email drafts.',
      parameters: {
        type: 'object',
        properties: {
          maxResults: { type: 'number', description: 'Maximum drafts to return' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_purchase_emails',
      description: 'Get purchase confirmations, receipts, and order emails.',
      parameters: {
        type: 'object',
        properties: {
          maxResults: { type: 'number', description: 'Maximum purchase emails to return' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_spam_emails',
      description: 'Get emails flagged in the spam folder.',
      parameters: {
        type: 'object',
        properties: {
          maxResults: { type: 'number', description: 'Maximum spam emails to return' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_scheduled_emails',
      description: 'Get all emails scheduled for future sending.',
      parameters: {
        type: 'object',
        properties: {
          maxResults: { type: 'number', description: 'Maximum scheduled emails to return' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'star_email',
      description: 'Star or unstar a specific email message.',
      parameters: {
        type: 'object',
        properties: {
          messageId: { type: 'string', description: 'The email message ID' },
          isStarred: { type: 'boolean', description: 'Set true to star, false to unstar' }
        },
        required: ['messageId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'schedule_email',
      description: 'Schedule an email message to be sent at a future date and time.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject' },
          body: { type: 'string', description: 'Email body text' },
          scheduledAt: { type: 'string', description: 'Scheduled ISO date string or human readable time (e.g. tomorrow at 9 AM)' }
        },
        required: ['to', 'subject', 'body', 'scheduledAt']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mark_as_spam',
      description: 'Move an email message to Spam.',
      parameters: {
        type: 'object',
        properties: {
          messageId: { type: 'string', description: 'The email message ID to flag as spam' }
        },
        required: ['messageId']
      }
    }
  }
];

export async function executeAgentTool(
  toolName: string,
  args: Record<string, any>,
  accessToken?: string,
  userId: string = 'demo-user',
  conversationId?: string
): Promise<any> {
  console.log(`[AGENT TOOL EXECUTION] Invoking tool: ${toolName}`, args);
  let result: any;
  let status: 'completed' | 'error' = 'completed';

  try {
    switch (toolName) {
      case 'list_emails': {
        const maxResults = args.maxResults || 10;
        result = await gmailService.searchEmails(accessToken, 'in:inbox', maxResults);
        break;
      }
      case 'get_email': {
        const messageId = args.messageId;
        result = await gmailService.getEmail(accessToken, messageId);
        break;
      }
      case 'search_emails': {
        const query = args.query || '';
        const maxResults = args.maxResults || 10;
        result = await gmailService.searchEmails(accessToken, query, maxResults);
        break;
      }
      case 'search_important_emails': {
        const maxResults = args.maxResults || 10;
        result = await gmailService.searchEmails(accessToken, 'is:unread OR is:starred OR label:IMPORTANT', maxResults);
        break;
      }
      case 'list_templates': {
        result = dbStore.getTemplates();
        break;
      }
      case 'get_template': {
        result = dbStore.getTemplateById(args.templateId);
        if (!result) result = { error: 'Template not found' };
        break;
      }
      case 'create_email_template': {
        result = await dbStore.saveTemplate({
          name: args.name,
          description: args.description,
          category: args.category,
          subjectTemplate: args.subjectTemplate,
          htmlContent: args.htmlContent
        });
        break;
      }
      case 'render_email_template': {
        let htmlContent = args.htmlContent;
        if (!htmlContent && args.templateId) {
          const tpl = dbStore.getTemplateById(args.templateId);
          if (tpl) htmlContent = tpl.htmlContent;
        }

        if (!htmlContent) {
          result = { error: 'Template HTML content missing' };
        } else {
          let rendered = htmlContent
            .replace(/\{\{\s*recipientName\s*\}\}/g, args.recipientName || 'Valued Recipient')
            .replace(/\{\{\s*subject\s*\}\}/g, args.subject || 'Message')
            .replace(/\{\{\s*bodyContent\s*\}\}/g, (args.bodyContent || '').replace(/\n/g, '<br/>'))
            .replace(/\{\{\s*ctaText\s*\}\}/g, args.ctaText || 'View Details')
            .replace(/\{\{\s*ctaLink\s*\}\}/g, args.ctaLink || '#')
            .replace(/\{\{\s*senderName\s*\}\}/g, args.senderName || 'AI Assistant');
          result = { renderedHtml: rendered };
        }
        break;
      }
      case 'summarize_email': {
        const message = await gmailService.getEmail(accessToken, args.messageId);
        if (message) {
          const summary = await generateEmailSummaryDirect(message.subject, message.sender, message.body);
          await dbStore.saveEmailSummary(args.messageId, summary);
          result = { messageId: args.messageId, summary };
        } else {
          result = { error: 'Email message not found' };
        }
        break;
      }
      case 'extract_email_tasks': {
        const message = await gmailService.getEmail(accessToken, args.messageId);
        if (message) {
          result = {
            messageId: args.messageId,
            tasks: message.extractedTasks || [
              {
                id: 'task_' + Date.now(),
                task: `Follow up on email: "${message.subject}"`,
                personResponsible: 'You',
                deadline: 'As soon as possible',
                relevantEmailId: args.messageId,
                completed: false
              }
            ]
          };
        } else {
          result = { error: 'Email message not found' };
        }
        break;
      }
      case 'draft_reply': {
        const { messageId, instructions, templateId } = args;
        result = await gmailService.draftReply(accessToken, messageId, instructions);
        if (templateId && result) {
          const tpl = dbStore.getTemplateById(templateId);
          if (tpl) {
            const formattedBody = tpl.htmlContent
              .replace(/\{\{\s*recipientName\s*\}\}/g, result.to.split('<')[0] || 'Recipient')
              .replace(/\{\{\s*subject\s*\}\}/g, result.subject)
              .replace(/\{\{\s*bodyContent\s*\}\}/g, result.body.replace(/\n/g, '<br/>'))
              .replace(/\{\{\s*ctaText\s*\}\}/g, 'View Details')
              .replace(/\{\{\s*ctaLink\s*\}\}/g, '#')
              .replace(/\{\{\s*senderName\s*\}\}/g, 'Me');
            result.body = formattedBody;
            result.isHtml = true;
          }
        }
        break;
      }
      case 'send_email': {
        if (!args.userApproved) {
          result = { error: 'Cannot send email without user approval flag (userApproved: true)' };
        } else {
          result = await gmailService.sendEmail(accessToken, {
            to: args.to,
            subject: args.subject,
            body: args.body,
            isHtml: args.isHtml || false
          });
        }
        break;
      }
      case 'save_memory': {
        result = await dbStore.saveMemory(userId, args.key, args.value, args.category);
        break;
      }
      case 'get_memory': {
        result = await dbStore.getMemory(userId, args.key);
        if (!result) result = { memory: null, message: `No memory found for key: ${args.key}` };
        break;
      }
      case 'mark_as_read': {
        result = await gmailService.markAsRead(accessToken, args.messageId);
        break;
      }
      case 'archive_email': {
        result = await gmailService.archiveEmail(accessToken, args.messageId);
        break;
      }
      case 'mark_sender_important': {
        const isImp = args.isImportant !== false;
        if (isImp) {
          const senders = await dbStore.addImportantSender(userId, args.senderEmail);
          result = { success: true, senderEmail: args.senderEmail, isImportant: true, importantSenders: senders, message: `Sender ${args.senderEmail} marked as Important VIP user.` };
        } else {
          const senders = await dbStore.removeImportantSender(userId, args.senderEmail);
          result = { success: true, senderEmail: args.senderEmail, isImportant: false, importantSenders: senders, message: `Sender ${args.senderEmail} removed from Important senders.` };
        }
        break;
      }
      case 'list_important_senders': {
        const senders = await dbStore.getImportantSenders(userId);
        result = { success: true, count: senders.length, importantSenders: senders };
        break;
      }
      case 'list_starred_emails': {
        const maxResults = args.maxResults || 10;
        result = await gmailService.searchEmails(accessToken, 'is:starred', maxResults);
        break;
      }
      case 'list_draft_emails': {
        const maxResults = args.maxResults || 10;
        result = await gmailService.searchEmails(accessToken, 'is:draft', maxResults);
        break;
      }
      case 'list_purchase_emails': {
        const maxResults = args.maxResults || 10;
        result = await gmailService.searchEmails(accessToken, 'category:purchases', maxResults);
        break;
      }
      case 'list_spam_emails': {
        const maxResults = args.maxResults || 10;
        result = await gmailService.searchEmails(accessToken, 'in:spam', maxResults);
        break;
      }
      case 'list_scheduled_emails': {
        const maxResults = args.maxResults || 10;
        result = await gmailService.searchEmails(accessToken, 'is:scheduled', maxResults);
        break;
      }
      case 'star_email': {
        const { messageId, isStarred } = args;
        const updated = await gmailService.toggleStar(accessToken, messageId, isStarred);
        if (updated) {
          result = { success: true, messageId, isStarred: updated.isStarred, message: `Email ${messageId} is now ${updated.isStarred ? 'starred' : 'unstarred'}.` };
        } else {
          result = { error: 'Email message not found' };
        }
        break;
      }
      case 'mark_as_spam': {
        result = await gmailService.markAsSpam(accessToken, args.messageId);
        result = { success: true, messageId: args.messageId, message: `Email ${args.messageId} moved to Spam.` };
        break;
      }
      case 'schedule_email': {
        const { to, subject, body, scheduledAt } = args;
        const scheduled = await gmailService.scheduleEmail(accessToken, { to, subject, body, scheduledAt });
        result = { success: true, scheduledEmail: scheduled, message: `Email to ${to} scheduled for ${scheduledAt}.` };
        break;
      }
      default:
        status = 'error';
        result = { error: `Tool ${toolName} not recognized.` };
    }
  } catch (err: any) {
    status = 'error';
    result = { error: err?.message || 'Tool execution failed' };
  }

  // Log action in database store for memory & transparency
  await dbStore.logAction({
    userId,
    conversationId,
    tool: toolName,
    input: args,
    output: result,
    status
  });

  return result;
}
