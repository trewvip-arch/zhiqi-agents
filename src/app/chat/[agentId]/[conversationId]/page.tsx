'use client';

import { useState, useEffect, use } from 'react';
import { message, Spin } from 'antd';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { getAgentById } from '@/config/agents';
import { Message } from '@/types/conversation';
import { getConversation, chat } from '@/app/actions/conversation-actions';

interface ConversationPageProps {
  params: Promise<{
    agentId: string;
    conversationId: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { agentId, conversationId } = use(params);
  const agent = getAgentById(agentId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadConversation = async () => {
      setIsLoading(true);
      const conversation = await getConversation(conversationId);
      if (conversation) {
        setMessages(conversation.messages);
      } else {
        message.error('会话不存在');
      }
      setIsLoading(false);
    };

    loadConversation();
  }, [conversationId]);

  const handleSend = async (content: string) => {
    if (!agent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const result = await chat(conversationId, agentId, agent.appId, content);

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.content || '',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        message.error(result.error || '发送失败');
      }
    } catch (error) {
      message.error('网络错误，请重试');
    } finally {
      setIsSending(false);
    }
  };

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
      />
      <ChatInput onSend={handleSend} disabled={isSending} />
    </>
  );
}
