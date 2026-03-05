'use client';

import { useRef, useEffect } from 'react';
import { Empty, Spin } from 'antd';
import MessageItem from './MessageItem';
import { Message } from '@/types/conversation';

interface MessageListProps {
  messages: Message[];
  agentAvatar: string;
  isLoading?: boolean;
}

export default function MessageList({
  messages,
  agentAvatar,
  isLoading,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
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
      {isLoading && (
        <div className="flex gap-3">
          <span className="text-2xl">{agentAvatar}</span>
          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm">
            <Spin size="small" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
