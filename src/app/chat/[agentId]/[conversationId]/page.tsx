'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { message, Spin } from 'antd';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { Message } from '@/types/conversation';
import { getConversation } from '@/app/actions/conversation-actions';
import { getAgentById } from '@/app/actions/agent';
import { Agent } from '@/types/agent';

interface ConversationPageProps {
  params: Promise<{
    agentId: string;
    conversationId: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { agentId, conversationId } = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const agentData = await getAgentById(agentId);
      setAgent(agentData);
      const conversation = await getConversation(conversationId);
      if (conversation) {
        setMessages(conversation.messages);
      } else {
        message.error('会话不存在');
      }
      setIsLoading(false);
    };

    loadData();
  }, [agentId, conversationId]);

  const handleSend = useCallback(async (content: string) => {
    if (!agent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
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
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: fullContent,
                createdAt: new Date(),
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamingContent('');
              setIsSending(false);
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
      setIsSending(false);
      setStreamingContent('');
    }
  }, [conversationId, agent]);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>未找到该数字员工</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <ChatHeader agent={agent} />
      <MessageList
        messages={messages}
        agentAvatar={agent.avatar}
        isLoading={isSending}
        streamingContent={streamingContent}
      />
      <ChatInput onSend={handleSend} disabled={isSending} />
    </>
  );
}
