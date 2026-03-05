'use client';

import { useEffect, use, useState, useRef } from 'react';
import { Spin, App } from 'antd';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { getConversation, addMessage,
 updateSessionId } from '@/app/actions/conversation-actions';
import { getAgentById } from '@/app/actions/agent';
import { Agent } from '@/types/agent';
import { Message } from '@/types/conversation';

interface ConversationPageProps {
  params: Promise<{
    agentId: string;
    conversationId: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { message } = App.useApp();
  const { agentId, conversationId } = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const agentData = await getAgentById(agentId);
      setAgent(agentData);
      const conversation = await getConversation(conversationId);
      if (conversation) {
        setInitialMessages(conversation.messages);
        sessionIdRef.current = conversation.sessionId;
      } else {
        message.error('会话不存在');
      }
      setLoading(false);
    };

    loadData();
  }, [agentId, conversationId]);

  // 转换初始消息为 AI SDK 格式
  const initialAiMessages = initialMessages.map(msg => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: 'text' as const, text: msg.content }],
  }));

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: initialAiMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat/stream',
      prepareSendMessagesRequest: ({ id, messages: msgs }) => {
        const lastMessage = msgs[msgs.length - 1];
        const textContent = lastMessage?.parts
          ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map(p => p.text)
          .join('') || '';

        return {
          body: {
            conversationId: id,
            appId: agent?.appId,
            message: textContent,
            sessionId: sessionIdRef.current,
          },
        };
      },
    }),
    onFinish: async ({ message: msg }) => {
      if (conversationId) {
        const textContent = (msg as UIMessage).parts
          ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map(p => p.text)
          .join('') || '';
        if (textContent) {
          await addMessage(conversationId, 'assistant', textContent);
        }
        // 从 metadata 中提取 sessionId 并保存
        const metadata = (msg as UIMessage & { metadata?: { sessionId?: string } }).metadata;
        if (metadata?.sessionId && metadata.sessionId !== sessionIdRef.current) {
          sessionIdRef.current = metadata.sessionId;
          await updateSessionId(conversationId, metadata.sessionId);
        }
      }
    },
    onError: (err) => {
      message.error(err.message || '发生错误');
    },
  });

  // 保存用户消息并发送
  const handleSend = async (content: string) => {
    if (!conversationId) return;
    await addMessage(conversationId, 'user', content);
    sendMessage({ role: 'user', parts: [{ type: 'text', text: content }] });
  };

  // 转换 AI SDK 消息格式到组件格式
  const convertedMessages: Message[] = messages.map((msg: UIMessage) => {
    const textContent = msg.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('') || '';

    return {
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: textContent,
      createdAt: new Date(),
    };
  });

  const isStreaming = status === 'streaming';

  useEffect(() => {
    if (error) {
      message.error(error.message || '网络错误');
    }
  }, [error]);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>未找到该数字员工</p>
      </div>
    );
  }

  if (loading) {
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
        messages={convertedMessages}
        agentAvatar={agent.avatar}
        isLoading={isStreaming}
      />
      <ChatInput onSend={handleSend} disabled={status !== 'ready'} />
    </>
  );
}
