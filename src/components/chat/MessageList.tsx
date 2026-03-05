'use client';

import { useRef, useEffect } from 'react';
import { Empty } from 'antd';
import MessageItem from './MessageItem';
import { Message } from '@/types/conversation';

interface MessageListProps {
  messages: Message[];
  agentAvatar: string;
  isLoading?: boolean;
  /** @deprecated AI SDK 已经将流式内容添加到 messages 数组中，不再需要单独传递 */
  streamingContent?: string;
}

export default function MessageList({
  messages,
  agentAvatar,
  isLoading,
  streamingContent,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, streamingContent]);

  if (messages.length === 0 && !isLoading && !streamingContent) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty
          description="开始对话吧"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} agentAvatar={agentAvatar} />
      ))}
      {streamingContent && (
        <MessageItem
          message={{
            id: 'streaming',
            role: 'assistant',
            content: streamingContent,
            createdAt: new Date(),
          }}
          agentAvatar={agentAvatar}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
