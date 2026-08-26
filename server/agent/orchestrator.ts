import { GoogleGenAI } from '@google/genai';
import { AGENT_SYSTEM_PROMPT } from './systemPrompt';
import { GMAIL_TOOLS_SCHEMA, executeAgentTool } from './tools';
import { selectBestSkill, AgentSkill } from './skills';
import { dbStore } from '../models/db';
import { ConversationMessage, DraftReply } from '../../src/types';

const MAX_ORCHESTRATION_STEPS = 8;

export interface OrchestrationOptions {
  userId: string;
  conversationId?: string;
  userMessage: string;
  accessToken?: string;
}

export interface OrchestrationResult {
  reply: string;
  conversationId: string;
  activeSkill: {
    id: string;
    name: string;
    confidence: number;
  };
  toolsExecuted: {
    tool: string;
    input: any;
    output: any;
  }[];
  draft?: DraftReply;
  userMemoryUsed?: Record<string, any>;
}

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
      'X-Title': 'Mail Assistant AI Orchestrator'
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

async function callGeminiSDK(messages: any[], tools: any[], systemPrompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const ai = new GoogleGenAI({ apiKey });

  const functionDeclarations = GMAIL_TOOLS_SCHEMA.map(t => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters
  }));

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
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: functionDeclarations as any }]
    }
  });

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

/**
 * Autonomous Agent Orchestration Loop
 */
export async function orchestrateAgentTask(options: OrchestrationOptions): Promise<OrchestrationResult> {
  const { userId, userMessage, accessToken } = options;
  const conversationId = options.conversationId || 'conv_' + Date.now();

  console.log(`[ORCHESTRATION LOOP] User ${userId} | Conv ${conversationId} | Goal: "${userMessage}"`);

  // Step 1: Load MongoDB Memory & User Context
  const userMemory = await dbStore.getAllMemories(userId);

  // Step 2: Skill Selection Logic
  const { bestSkill, confidence } = selectBestSkill(userMessage, { memory: userMemory });
  console.log(`[ORCHESTRATION] Selected Skill: "${bestSkill.name}" (Confidence: ${confidence})`);

  // Step 3: Fetch or Create Conversation History from MongoDB
  let conv = await dbStore.getConversationById(conversationId);
  if (!conv) {
    conv = {
      id: conversationId,
      userId,
      title: userMessage.substring(0, 45) + '...',
      messages: [],
      updatedAt: new Date().toISOString()
    };
  }

  // Append new User Message
  const userMsgObj: ConversationMessage = {
    id: 'msg_' + Date.now(),
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  };
  conv.messages.push(userMsgObj);

  // Step 4: Construct System Prompt with Skill Guidance & MongoDB Memory Context
  const memoryContextStr = Object.keys(userMemory).length > 0
    ? `\n\nUSER MEMORY CONTEXT (Stored in MongoDB):\n${JSON.stringify(userMemory, null, 2)}`
    : '';

  const skillPrompt = bestSkill.getInstructionPrompt(userMessage, userMemory);
  const fullSystemPrompt = `${AGENT_SYSTEM_PROMPT}\n\n${skillPrompt}${memoryContextStr}`;

  const apiMessages: any[] = [
    { role: 'system', content: fullSystemPrompt }
  ];

  // Include conversation history slice (last 12 messages)
  const historySlice = conv.messages.slice(-12);
  for (const m of historySlice) {
    if (m.role === 'user') {
      apiMessages.push({ role: 'user', content: m.content });
    } else if (m.role === 'assistant') {
      apiMessages.push({ role: 'assistant', content: m.content || '' });
    }
  }

  const toolsExecuted: { tool: string; input: any; output: any }[] = [];
  let generatedDraft: DraftReply | undefined;
  let finalResponse = '';
  let step = 0;

  // Step 5: Iterative Autonomous Orchestration Loop
  while (step < MAX_ORCHESTRATION_STEPS) {
    step++;
    console.log(`[ORCHESTRATION LOOP] Step ${step}/${MAX_ORCHESTRATION_STEPS}...`);

    let assistantMsg: any;
    try {
      if (process.env.OPENROUTER_API_KEY) {
        assistantMsg = await callOpenRouterAPI(apiMessages, GMAIL_TOOLS_SCHEMA);
      } else {
        assistantMsg = await callGeminiSDK(apiMessages, GMAIL_TOOLS_SCHEMA, fullSystemPrompt);
      }
    } catch (err: any) {
      console.warn(`[ORCHESTRATION] OpenRouter API error: ${err.message}. Trying Gemini SDK...`);
      try {
        assistantMsg = await callGeminiSDK(apiMessages, GMAIL_TOOLS_SCHEMA, fullSystemPrompt);
      } catch (geminiErr: any) {
        console.error(`[ORCHESTRATION] Model execution error: ${geminiErr.message}`);
        finalResponse = `I encountered an issue executing the orchestration step: ${geminiErr.message}. Please verify API settings.`;
        break;
      }
    }

    if (!assistantMsg) {
      finalResponse = 'No response returned from the agent orchestration model.';
      break;
    }

    apiMessages.push(assistantMsg);

    // Evaluate Tool Calls
    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      for (const toolCall of assistantMsg.tool_calls) {
        const toolName = toolCall.function.name;
        let args: Record<string, any> = {};
        try {
          args = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
        } catch (e) {
          args = {};
        }

        console.log(`[ORCHESTRATION Step ${step}] Executing Tool: "${toolName}"`, args);

        const toolResult = await executeAgentTool(
          toolName,
          args,
          accessToken,
          userId,
          conversationId
        );

        toolsExecuted.push({
          tool: toolName,
          input: args,
          output: toolResult
        });

        if (toolName === 'draft_reply' && toolResult && toolResult.to) {
          generatedDraft = toolResult as DraftReply;
        }

        // Feed tool output back to conversation history
        apiMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id || 'call_' + Math.random().toString(36).substring(2, 9),
          tool_name: toolName,
          content: JSON.stringify(toolResult)
        });
      }
    } else {
      // Model produced final textual synthesis!
      finalResponse = assistantMsg.content || 'Task completed successfully.';
      break;
    }
  }

  if (step >= MAX_ORCHESTRATION_STEPS && !finalResponse) {
    finalResponse = 'Reached maximum orchestration step limit. Here is the summary of collected outputs.';
  }

  // Step 6: Persist Conversation Message and Memory to MongoDB
  const assistantMsgObj: ConversationMessage = {
    id: 'msg_' + Date.now(),
    role: 'assistant',
    content: finalResponse,
    timestamp: new Date().toISOString(),
    toolCalls: toolsExecuted.map(t => ({
      tool: t.tool,
      input: t.input,
      output: t.output,
      status: 'success'
    })),
    draft: generatedDraft
  };

  conv.messages.push(assistantMsgObj);
  conv.updatedAt = new Date().toISOString();
  await dbStore.saveConversation(conv);

  return {
    reply: finalResponse,
    conversationId,
    activeSkill: {
      id: bestSkill.id,
      name: bestSkill.name,
      confidence
    },
    toolsExecuted,
    draft: generatedDraft,
    userMemoryUsed: userMemory
  };
}
