'use server';

import { addMessage } from './conversation';
import { sendMessageStream, SendMessageInput } from '@/lib/bailian';

export async function chat(
  conversationId: string,
  agentId: string,
  appId: string,
  userMessage: string
) {
  // Save user message
  await addMessage(conversationId, 'user', userMessage);

  // Stream response from 百炼
  const input: SendMessageInput = {
    appId,
    message: userMessage,
  };

  let fullResponse = '';

  try {
    const stream = sendMessageStream(input);

    const chunks: string[] = [];

    for await (const chunk of stream) {
      if (chunk.done) break;
      chunks.push(chunk.content);
      fullResponse += chunk.content;
    }

    // Save assistant message
    await addMessage(conversationId, 'assistant', fullResponse);

    return {
      success: true,
      content: fullResponse,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
