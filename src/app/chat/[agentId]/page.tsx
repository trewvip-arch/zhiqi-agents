'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { message, Spin } from 'antd';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { Message } from '@/types/conversation';
import { createConversation } from '@/app/actions/conversation-actions';
import { getAgentById } from '@/app/actions/agent';
import { Agent } from '@/types/agent';

interface ChatPageProps {
  params: Promise<{
    agentId: string;
  }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { agentId } = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const agentData = await getAgentById(agentId);
      setAgent(agentData);
      if (agentData) {
        const id = await createConversation(agentId);
        setConversationId(id);
      }
      setLoading(false);
    };
    init();
  }, [agentId]);

  const handleSend = useCallback(async (content: string) => {
    if (!conversationId || !agent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          appId: agent.appId,
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
      let fullContent = '';

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
              // Add complete message
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: fullContent,
                createdAt: new Date(),
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamingContent('');
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
              if (parsed.error) {
                message.error(parsed.error);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      message.error('网络错误，请重试');
      setIsLoading(false);
      setStreamingContent('');
    }
  }, [conversationId, agent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>未找到该数字员工</p>
      </div>
    );
  }

  return (
    <>
      <ChatHeader agent={agent} />
      <MessageList
        messages={messages}
        agentAvatar={agent.avatar}
        isLoading={isLoading}
        streamingContent={streamingContent}
      />
      <ChatInput onSend={handleSend} disabled={isLoading || !conversationId} />
    </>
  );
}
