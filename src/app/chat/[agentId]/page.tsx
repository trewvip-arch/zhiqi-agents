'use client';

import { useState, useEffect } from 'react';
import { message, Spin } from 'antd';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { Message } from '@/types/conversation';
import { createConversation, chat } from '@/app/actions/conversation-actions';
import { getAgentById } from '@/app/actions/agent';
import { Agent } from '@/types/agent';

interface ChatPageProps {
  params: {
    agentId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const { agentId } = params;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSend = async (content: string) => {
    if (!conversationId || !agent) return;

    console.log('[ChatPage] Sending message:', { conversationId, agentId, appId: agent.appId });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await chat(conversationId, agentId, agent.appId, content);
      console.log('[ChatPage] Chat result:', result);

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
      setIsLoading(false);
    }
  };

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
      />
      <ChatInput onSend={handleSend} disabled={isLoading || !conversationId} />
    </>
  );
}
