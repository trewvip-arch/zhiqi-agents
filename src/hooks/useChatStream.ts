'use client';

import { useCallback } from 'react';
import { Message } from '@/types/conversation';

interface UseChatStreamOptions {
  conversationId: string | null;
  appId: string;
  onMessageStart?: (message: Message) => void;
  onMessageChunk?: (content: string) => void;
  onMessageEnd?: () => void;
  onError?: (error: string) => void;
}

export function useChatStream({
  conversationId,
  appId,
  onMessageStart,
  onMessageChunk,
  onMessageEnd,
  onError,
}: UseChatStreamOptions) {
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        createdAt: new Date(),
      };

      onMessageStart?.(userMessage);

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            appId,
            message: content,
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();

              if (data === '[DONE]') {
                onMessageEnd?.();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  onMessageChunk?.(parsed.content);
                }
                if (parsed.error) {
                  onError?.(parsed.error);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    },
    [conversationId, appId, onMessageStart, onMessageChunk, onMessageEnd, onError]
  );

  return { sendMessage };
}
