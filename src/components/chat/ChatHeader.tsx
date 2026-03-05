'use client';

import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Agent } from '@/types/agent';

const { Text } = Typography;

interface ChatHeaderProps {
  agent: Agent;
}

export default function ChatHeader({ agent }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border-b sticky top-0 z-10">
      <Link href="/">
        <Button type="text" icon={<ArrowLeftOutlined />} />
      </Link>
      <span className="text-3xl">{agent.avatar}</span>
      <div>
        <Text strong className="text-lg block">
          {agent.name}
        </Text>
        <Text type="secondary" className="text-sm">
          {agent.tags.join(' · ')}
        </Text>
      </div>
    </div>
  );
}
