import { GoogleGenAI } from '@google/genai';
import { AGENT_SYSTEM_PROMPT } from './systemPrompt';
import { GMAIL_TOOLS_SCHEMA, executeAgentTool } from './tools';
import { dbStore } from '../models/db';
import { ConversationMessage, DraftReply } from '../../src/types';

const MAX_AGENT_STEPS = 8;

interface AgentLoopOptions {
  userId: string;
  conversationId?: string;
  userMessage: string;
  history?: ConversationMessage[];
  accessToken?: string;
}

interface AgentLoopResult {
  reply: string;
  conversationId: string;
  toolsExecuted: {
    tool: string;
    input: any;
    output: any;
  }[];
  draft?: DraftReply;
}

/**
 * Execute OpenRouter OpenAI-compatible chat completion call
 */
async function callOpenRouterAPI(messages: any[], tools: any[]): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY_MISSING');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'Mail Assistant AI Agent'
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message;
}

/**
 * Fallback server-side Gemini SDK call using built-in GEMINI_API_KEY
 */
async function callGeminiSDK(messages: any[], tools: any[]): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Format system prompt and contents for Google GenAI SDK
  const systemInstruction = AGENT_SYSTEM_PROMPT;
  
  // Map OpenAI tools format to Gemini functionDeclarations format
  const functionDeclarations = GMAIL_TOOLS_SCHEMA.map(t => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters
  }));

  // Format chat contents
  const contents: any[] = [];
  for (const m of messages) {
    if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content }] });
    } else if (m.role === 'assistant') {
      const parts: any[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.tool_calls) {
        for (const tc of m.tool_calls) {
          parts.push({
            functionCall: {
              name: tc.function.name,
              args: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments
            }
          });
        }
      }
      contents.push({ role: 'model', parts });
    } else if (m.role === 'tool') {
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: m.name || m.tool_name,
            response: typeof m.content === 'string' ? JSON.parse(m.content) : m.content
          }
        }]
      });
    }
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: functionDeclarations as any }]
    }
  });

  // Convert Gemini output to standardized assistant message format
  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  let text = '';
  const tool_calls: any[] = [];

  for (const part of parts) {
    if (part.text) text += part.text;
    if (part.functionCall) {
      tool_calls.push({
        id: 'call_' + Math.random().toString(36).substring(2, 9),
        type: 'function',
        function: {
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args || {})
        }
      });
    }
  }

  return {
    role: 'assistant',
    content: text || null,
    tool_calls: tool_calls.length > 0 ? tool_calls : undefined
  };
}

import { orchestrateAgentTask } from './orchestrator';

/**
 * Main AI Agent Loop delegating to Orchestrator
 */
export async function runAgentLoop(options: AgentLoopOptions): Promise<AgentLoopResult> {
  const result = await orchestrateAgentTask({
    userId: options.userId,
    conversationId: options.conversationId,
    userMessage: options.userMessage,
    accessToken: options.accessToken
  });

  return {
    reply: result.reply,
    conversationId: result.conversationId,
    toolsExecuted: result.toolsExecuted,
    draft: result.draft
  };
}

/**
 * Directly generate an AI summary for an email without creating or saving a chat conversation
 */
export async function generateEmailSummaryDirect(
  subject: string,
  sender: string,
  body: string
): Promise<string> {
  const prompt = `You are an executive email summarizer. Generate a clean, concise, beautifully formatted markdown summary of the following email.
Structure your summary into these sections:
1. **Executive Overview**: A 1-2 sentence core summary of the message.
2. **Key Takeaways**: Clear bullet points highlighting essential details.
3. **Action Items**: Explicit tasks or deadlines required (or "No immediate action required").

Email Details:
Subject: ${subject}
From: ${sender}
Body:
${body}`;

  const messages = [
    { role: 'system', content: 'You are an expert email summarization assistant.' },
    { role: 'user', content: prompt }
  ];

  try {
    if (process.env.OPENROUTER_API_KEY) {
      const result = await callOpenRouterAPI(messages, []);
      if (result?.content) return result.content;
    }
  } catch (err) {
    console.warn('[EMAIL SUMMARY] OpenRouter API call failed, trying Gemini SDK fallback:', err);
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      if (response.text) return response.text;
    }
  } catch (err) {
    console.error('[EMAIL SUMMARY] Gemini SDK call failed:', err);
  }

  // Pure fallback if LLM key is unavailable or fails
  return `### Executive Overview\n- **Subject**: ${subject}\n- **From**: ${sender}\n\n### Key Takeaways\n${body.slice(0, 250)}...`;
}

/**
 * Directly generate a responsive HTML email template string using AI
 */
export async function generateHtmlTemplateDirect(userPrompt: string): Promise<string> {
  const prompt = `You are an expert HTML email designer. Create a complete, standalone, production-grade, responsive HTML email template based on the following user prompt:
"${userPrompt}"

RULES:
1. Output ONLY valid, modern, responsive HTML code. Do NOT wrap in extra markdown block text if possible, or produce raw HTML inside code block.
2. Use inline CSS styles for high email client compatibility (Outlook, Gmail, Apple Mail).
3. Include standard template placeholders:
   - {{recipientName}}
   - {{subject}}
   - {{bodyContent}}
   - {{ctaText}}
   - {{ctaLink}}
   - {{senderName}}
4. Ensure attractive typography, padding, color contrast, and clean layout (cards, headers, call-to-action button, footer).
5. Make sure the HTML is complete with <!DOCTYPE html><html><head><style>...</style></head><body>...</body></html>.`;

  const messages = [
    { role: 'system', content: 'You are a master email designer creating production-ready HTML email templates with inline CSS styles.' },
    { role: 'user', content: prompt }
  ];

  let rawOutput = '';

  try {
    if (process.env.OPENROUTER_API_KEY) {
      const result = await callOpenRouterAPI(messages, []);
      if (result?.content) rawOutput = result.content;
    }
  } catch (err) {
    console.warn('[HTML TEMPLATE AI] OpenRouter API call failed, trying Gemini SDK fallback:', err);
  }

  if (!rawOutput && process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      if (response.text) rawOutput = response.text;
    } catch (err) {
      console.error('[HTML TEMPLATE AI] Gemini SDK call failed:', err);
    }
  }

  if (rawOutput) {
    // Strip markdown code fence if present
    const cleaned = rawOutput
      .replace(/^```html/i, '')
      .replace(/^```/i, '')
      .replace(/```$/i, '')
      .trim();
    return cleaned;
  }

  // Fallback template if AI call is unavailable
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; background: #f8fafc; padding: 20px; color: #334155; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .btn { display: inline-block; background: #2563eb; color: #fff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>{{subject}}</h2>
    <p>Hi {{recipientName}},</p>
    <div>{{bodyContent}}</div>
    <a href="{{ctaLink}}" class="btn">{{ctaText}}</a>
    <p style="margin-top:24px;">Best regards,<br><strong>{{senderName}}</strong></p>
  </div>
</body>
</html>`;
}

/**
 * Directly generate an email subject and body copy using AI
 */
export async function generateEmailWriterDirect(
  userPrompt: string,
  context?: { to?: string; subject?: string; tone?: string; existingBody?: string }
): Promise<{ subject: string; body: string }> {
  const tone = context?.tone || 'Professional';
  const existingSubject = context?.subject || '';
  const existingBody = context?.existingBody || '';

  const prompt = `You are an AI Email Writer assistant. Generate an email with both a subject line and a well-written message body.
User Instruction: "${userPrompt}"
Desired Tone: ${tone}
${existingSubject ? `Current Subject Context: "${existingSubject}"` : ''}
${existingBody ? `Current Body Draft Context: "${existingBody}"` : ''}

CRITICAL RULES:
1. Return ONLY a valid JSON object with exact keys: "subject" and "body".
2. "subject": A concise, engaging subject line.
3. "body": High-quality, clear, well-structured email content matching the requested tone.
4. Do NOT wrap in markdown formatting or explanatory text outside the JSON object.

Example output JSON format:
{"subject": "Meeting Follow-up & Next Steps", "body": "Hi team,\\n\\nThank you for the productive discussion..."}`;

  const messages = [
    { role: 'system', content: 'You are an expert executive email writer.' },
    { role: 'user', content: prompt }
  ];

  let rawOutput = '';

  try {
    if (process.env.OPENROUTER_API_KEY) {
      const result = await callOpenRouterAPI(messages, []);
      if (result?.content) rawOutput = result.content;
    }
  } catch (err) {
    console.warn('[EMAIL WRITER AI] OpenRouter API call failed, trying Gemini SDK fallback:', err);
  }

  if (!rawOutput && process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      if (response.text) rawOutput = response.text;
    } catch (err) {
      console.error('[EMAIL WRITER AI] Gemini SDK call failed:', err);
    }
  }

  if (rawOutput) {
    try {
      const cleaned = rawOutput
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.subject && parsed.body) {
        return { subject: parsed.subject, body: parsed.body };
      }
    } catch (e) {
      console.warn('[EMAIL WRITER AI] Failed to parse JSON output, returning fallback text parse');
    }
  }

  // Fallback if AI response parsing or API key was unavailable
  return {
    subject: existingSubject || 'Update regarding ' + userPrompt.slice(0, 30),
    body: `Dear recipient,\n\nI am writing to update you regarding: ${userPrompt}.\n\nPlease let me know if you have any questions or need further details.\n\nBest regards,`
  };
}

