'use server';

import { addMessage } from './conversation-actions';
import { sendMessageStream, SendMessageInput } from '@/lib/bailian';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

// Demo responses for testing without API key
const DEMO_RESPONSES = [
  "您好！我是AI数字员工，很高兴为您服务。目前系统处于演示模式，请配置DASHSCOPE_API_KEY以获得真实回复。",
  "我理解您的问题。在演示模式下，我只能提供预设的回复。请配置百炼API密钥以解锁完整功能。",
  "感谢您的提问！这是一个演示回复。要获得真实的AI回复，请在.env.local中配置DASHSCOPE_API_KEY。",
  "您好！演示模式下我会提供简单的回复。配置API后，我将能够提供更智能的服务。",
];

export async function chat(
  conversationId: string,
  agentId: string,
  appId: string,
  userMessage: string
) {
  console.log('[chat] Starting chat with:', { conversationId, agentId, appId, hasApiKey: !!DASHSCOPE_API_KEY });

  // Save user message
  await addMessage(conversationId, 'user', userMessage);

  // Check if API is configured
  if (!DASHSCOPE_API_KEY || !appId) {
    console.log('[chat] Demo mode - API key or appId missing');
    // Demo mode - return a mock response
    const randomResponse = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
    const demoResponse = `${randomResponse}\n\n您刚才说：「${userMessage.slice(0, 100)}${userMessage.length > 100 ? '...' : ''}」`;

    await addMessage(conversationId, 'assistant', demoResponse);

    return {
      success: true,
      content: demoResponse,
    };
  }

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
