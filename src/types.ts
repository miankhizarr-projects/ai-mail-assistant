export interface User {
  id: string;
  googleId?: string;
  email: string;
  name: string;
  username?: string;
  password?: string;
  isVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: string;
  picture?: string;
  isConnectedToGmail: boolean;
  createdAt?: string;
}

export interface TaskItem {
  id: string;
  task: string;
  personResponsible?: string;
  deadline?: string;
  relevantEmailId?: string;
  completed?: boolean;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  sender: string;
  recipients?: string[];
  subject: string;
  snippet: string;
  body: string;
  htmlBody?: string;
  date: string;
  labels: string[];
  isRead: boolean;
  isImportant?: boolean;
  isStarred?: boolean;
  isDraft?: boolean;
  isSpam?: boolean;
  isScheduled?: boolean;
  scheduledAt?: string;
  aiSummary?: string;
  category?: 'primary' | 'updates' | 'social' | 'promotions' | 'important' | 'starred' | 'drafts' | 'purchases' | 'spam' | 'scheduled';
  priority?: 'high' | 'medium' | 'low';
  extractedTasks?: TaskItem[];
}

export interface EmailThread {
  threadId: string;
  subject: string;
  messages: EmailMessage[];
}

export interface DraftReply {
  messageId?: string;
  threadId?: string;
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  templateId?: string;
  inReplyTo?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'invitation' | 'newsletter' | 'follow-up' | 'custom';
  subjectTemplate: string;
  htmlContent: string;
  isBuiltIn?: boolean;
  createdAt?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
  toolCalls?: {
    tool: string;
    input: Record<string, any>;
    output?: any;
    status?: 'pending' | 'success' | 'error';
  }[];
  draft?: DraftReply;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  updatedAt: string;
}

export interface AgentAction {
  id: string;
  userId: string;
  conversationId?: string;
  tool: string;
  input: Record<string, any>;
  output: any;
  status: 'pending' | 'completed' | 'error';
  createdAt: string;
}

export interface AgentStepStatus {
  step: number;
  tool: string;
  description: string;
  status: 'running' | 'completed' | 'failed';
  resultCount?: number;
}
