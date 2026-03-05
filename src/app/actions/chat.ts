'use server';

import { addMessage } from './conversation-actions';
import { sendMessageStream, SendMessageInput } from '@/lib/bailian';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

export async function chat(
  conversationId: string,
  agentId: string,
  appId: string,
  userMessage: string
) {
  console.log('[chat] Starting chat with:', { conversationId, agentId, appId, hasApiKey: !!DASHSCOPE_API_KEY });

  if (!DASHSCOPE_API_KEY || !appId) {
    throw new Error('请配置 DASHSCOPE_API_KEY 和 Agent App ID');
  }

  // Save user message
  await addMessage(conversationId, 'user', userMessage);

  // Stream response from 百炼
  const input: SendMessageInput = {
    appId,
    message: userMessage,
  };

  let fullResponse = '';

  try {
    console.log('[chat] Calling 百炼 API with appId:', appId);
    const stream = sendMessageStream(input);

    for await (const chunk of stream) {
      if (chunk.done) break;
      fullResponse += chunk.content;
    }

    console.log('[chat] Response received, length:', fullResponse.length);

    // Save assistant message
    await addMessage(conversationId, 'assistant', fullResponse);

    return {
      success: true,
      content: fullResponse,
    };
  } catch (error) {
    console.error('[chat] Chat error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
