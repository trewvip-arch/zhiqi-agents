'use client';

import { Typography } from 'antd';
import { Message } from '@/types/conversation';

const { Paragraph } = Typography;

interface MessageItemProps {
  message: Message;
  agentAvatar: string;
}

export default function MessageItem({ message, agentAvatar }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span className="text-2xl flex-shrink-0">
        {isUser ? '👤' : agentAvatar}
      </span>
      <div
        className={`max-w-[70%] p-4 rounded-2xl ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-white rounded-tl-none shadow-sm'
        }`}
      >
        <Paragraph
          className={`mb-0 whitespace-pre-wrap ${
            isUser ? 'text-white' : ''
          }`}
        >
          {message.content}
        </Paragraph>
      </div>
    </div>
  );
}
