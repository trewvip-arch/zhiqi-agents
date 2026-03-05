'use client';

import { Card, Tag, Typography } from 'antd';
import Link from 'next/link';
import { Agent } from '@/types/agent';

const { Text, Paragraph } = Typography;

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/chat/${agent.id}`} style={{ textDecoration: 'none' }}>
      <Card
        hoverable
        className="h-full transition-all duration-300 hover:shadow-lg"
        styles={{
          body: { padding: '20px' },
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="text-4xl">{agent.avatar}</span>
            <div className="flex-1 min-w-0">
              <Text strong className="text-base block mb-1">
                {agent.name}
              </Text>
              <Text type="secondary" className="text-xs">
                {agent.category}
              </Text>
            </div>
          </div>

          <Paragraph
            ellipsis={{ rows: 2 }}
            className="text-sm text-gray-600 mb-0"
          >
            {agent.description}
          </Paragraph>

          <div className="flex flex-wrap gap-1">
            {agent.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} color="blue" className="text-xs">
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
