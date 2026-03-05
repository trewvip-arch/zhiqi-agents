'use client';

import { useEffect, use, useState, useRef } from 'react';
import { Spin, App } from 'antd';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput, { AttachedFile } from '@/components/chat/ChatInput';
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

        // 提取文件附件
        const fileParts = lastMessage?.parts?.filter((p) => p.type === 'file') || [];
        const fileList = fileParts.length > 0
          ? fileParts.map((f) => ({ url: (f as { url: string }).url, filename: (f as { filename?: string }).filename }))
          : undefined;

        return {
          body: {
            conversationId: id,
            appId: agent?.appId,
            message: textContent,
            sessionId: sessionIdRef.current,
            fileList,
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
  const handleSend = async (content: string, files?: AttachedFile[]) => {
    if (!conversationId) return;
    await addMessage(conversationId, 'user', content);

    // 构建消息 parts，包含文本和文件
    const parts: Array<{ type: 'text'; text: string } | { type: 'file'; url: string; mediaType: string; filename?: string }> = [
      { type: 'text', text: content },
    ];

    // 如果有文件附件，添加到 parts 中（百炼文件问答使用 URL 格式）
    if (files && files.length > 0) {
      files.forEach(file => {
        parts.push({
          type: 'file' as const,
          url: file.url,
          mediaType: 'application/octet-stream', // 通用类型，百炼会识别 URL
          filename: file.name,
        });
      });
    }

    // 使用 any 绕过类型检查，因为 AI SDK 的类型定义可能不完整
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendMessage({ role: 'user', parts: parts as any });
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
        aiMessages={messages}
      />
      <ChatInput onSend={handleSend} disabled={status !== 'ready'} />
    </>
  );
}
