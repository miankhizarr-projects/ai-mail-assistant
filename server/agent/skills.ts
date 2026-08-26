export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  triggerKeywords: string[];
  recommendedTools: string[];
  canHandle(userGoal: string, context?: any): number; // Returns confidence score 0.0 - 1.0
  getInstructionPrompt(userGoal: string, memoryContext?: any): string;
}

export const EMAIL_TRIAGE_SKILL: AgentSkill = {
  id: 'skill_email_triage',
  name: 'Email Triage & Importance Scanner',
  description: 'Inspects inbox, identifies high priority or unread emails, manages VIP important senders, generates summaries, and highlights pending deadlines.',
  triggerKeywords: ['check inbox', 'unread', 'important', 'triage', 'recent mail', 'what missed', 'priority', 'emails requiring attention', 'mark sender', 'important sender', 'vip sender'],
  recommendedTools: ['search_important_emails', 'get_email', 'summarize_email', 'extract_email_tasks', 'mark_sender_important', 'list_important_senders'],
  canHandle(userGoal: string) {
    const goalLower = userGoal.toLowerCase();
    let matches = 0;
    for (const kw of this.triggerKeywords) {
      if (goalLower.includes(kw)) matches++;
    }
    return matches > 0 ? Math.min(0.5 + matches * 0.25, 0.99) : 0.1;
  },
  getInstructionPrompt(userGoal: string, memoryContext?: any) {
    return `[SKILL ACTIVATED: Email Triage & Importance Scanner]
Your objective is to scan for unread or important emails, manage important sender VIP rules, summarize key messages, and identify critical action items.
Recommended Tool Path:
1. If user requests to mark a sender/user as important, call 'mark_sender_important'.
2. If user requests list of important senders, call 'list_important_senders'.
3. Call 'search_important_emails' or 'list_emails' to retrieve messages.
4. Call 'get_email' for high priority messages.
5. Call 'summarize_email' and 'extract_email_tasks' for detailed insights.
Provide a clear, structured executive summary broken down into Priorities, Summaries, and Next Action Items.`;
  }
};

export const TEMPLATE_CREATION_SKILL: AgentSkill = {
  id: 'skill_template_management',
  name: 'HTML Email Template Designer & Creator',
  description: 'Manages, creates, renders, and selects professional HTML email templates in MongoDB.',
  triggerKeywords: ['template', 'create template', 'html email', 'design template', 'email style', 'newsletter template', 'html style'],
  recommendedTools: ['list_templates', 'get_template', 'create_email_template', 'render_email_template'],
  canHandle(userGoal: string) {
    const goalLower = userGoal.toLowerCase();
    let matches = 0;
    for (const kw of this.triggerKeywords) {
      if (goalLower.includes(kw)) matches++;
    }
    return matches > 0 ? Math.min(0.5 + matches * 0.25, 0.99) : 0.1;
  },
  getInstructionPrompt(userGoal: string) {
    return `[SKILL ACTIVATED: HTML Email Template Designer & Creator]
Your objective is to help the user create, select, render, or customize HTML email templates.
Recommended Tool Path:
1. Call 'list_templates' to view existing templates stored in MongoDB.
2. If creating a template, construct a complete HTML template with inline styles and placeholders ({{recipientName}}, {{subject}}, {{bodyContent}}, {{ctaText}}, {{ctaLink}}, {{senderName}}), then invoke 'create_email_template'.
3. Call 'render_email_template' to show the preview output.`;
  }
};

export const DRAFT_APPROVAL_SKILL: AgentSkill = {
  id: 'skill_draft_approval',
  name: 'Smart Email Drafting & Approval Workflow',
  description: 'Retrieves email context, checks user memory preferences, formats a professional response (optional HTML template), and creates a draft for user approval.',
  triggerKeywords: ['reply', 'draft', 'respond', 'write email', 'send reply', 'compose reply', 'answer email'],
  recommendedTools: ['get_email', 'get_memory', 'draft_reply', 'render_email_template'],
  canHandle(userGoal: string) {
    const goalLower = userGoal.toLowerCase();
    let matches = 0;
    for (const kw of this.triggerKeywords) {
      if (goalLower.includes(kw)) matches++;
    }
    return matches > 0 ? Math.min(0.5 + matches * 0.25, 0.99) : 0.1;
  },
  getInstructionPrompt(userGoal: string, memoryContext?: any) {
    return `[SKILL ACTIVATED: Smart Email Drafting & Approval Workflow]
Your objective is to craft an accurate, high-quality draft reply for user preview and explicit approval.
Recommended Tool Path:
1. Call 'get_email' or 'get_thread' to obtain context.
2. Call 'get_memory' to check user preferences (e.g. signature or preferred tone).
3. Call 'draft_reply' with instructions.
4. IMPORTANT: Present the generated draft clearly and explicitly remind the user that it will not be sent until they approve it.`;
  }
};

export const TASK_SUMMARY_SKILL: AgentSkill = {
  id: 'skill_task_summary',
  name: 'Task Extraction & Summarization',
  description: 'Analyzes single or multiple email messages to build a consolidated task list and executive summary.',
  triggerKeywords: ['summary', 'summarize', 'tasks', 'action items', 'todo', 'extract tasks', 'deadlines', 'overview'],
  recommendedTools: ['get_email', 'summarize_email', 'extract_email_tasks'],
  canHandle(userGoal: string) {
    const goalLower = userGoal.toLowerCase();
    let matches = 0;
    for (const kw of this.triggerKeywords) {
      if (goalLower.includes(kw)) matches++;
    }
    return matches > 0 ? Math.min(0.5 + matches * 0.25, 0.99) : 0.1;
  },
  getInstructionPrompt(userGoal: string) {
    return `[SKILL ACTIVATED: Task Extraction & Summarization]
Your objective is to synthesize email content into clear summaries and actionable task checklists with deadlines.
Recommended Tool Path:
1. Call 'get_email' to read message details.
2. Call 'summarize_email' for executive takeaways.
3. Call 'extract_email_tasks' for task tracking.`;
  }
};

export const MEMORY_CONTEXT_SKILL: AgentSkill = {
  id: 'skill_memory_context',
  name: 'Persistent Memory & Preferences',
  description: 'Saves or retrieves persistent user preferences, contacts, rules, and memory context from MongoDB.',
  triggerKeywords: ['remember', 'memory', 'preference', 'my signature', 'my name', 'my style', 'save memory', 'forget', 'what do you know'],
  recommendedTools: ['save_memory', 'get_memory'],
  canHandle(userGoal: string) {
    const goalLower = userGoal.toLowerCase();
    let matches = 0;
    for (const kw of this.triggerKeywords) {
      if (goalLower.includes(kw)) matches++;
    }
    return matches > 0 ? Math.min(0.5 + matches * 0.25, 0.99) : 0.1;
  },
  getInstructionPrompt(userGoal: string) {
    return `[SKILL ACTIVATED: Persistent Memory & Preferences]
Your objective is to query or store persistent user preferences, signatures, or contextual knowledge in MongoDB.
Recommended Tool Path:
- Call 'save_memory' to write persistent key-values.
- Call 'get_memory' to read existing knowledge.`;
  }
};

export const ALL_AGENT_SKILLS: AgentSkill[] = [
  EMAIL_TRIAGE_SKILL,
  TEMPLATE_CREATION_SKILL,
  DRAFT_APPROVAL_SKILL,
  TASK_SUMMARY_SKILL,
  MEMORY_CONTEXT_SKILL
];

export function selectBestSkill(userGoal: string, context?: any): { bestSkill: AgentSkill; confidence: number } {
  let highestConfidence = 0;
  let bestSkill = EMAIL_TRIAGE_SKILL;

  for (const skill of ALL_AGENT_SKILLS) {
    const conf = skill.canHandle(userGoal, context);
    if (conf > highestConfidence) {
      highestConfidence = conf;
      bestSkill = skill;
    }
  }

  return { bestSkill, confidence: highestConfidence };
}
