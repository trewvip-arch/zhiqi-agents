'use client';

import { useState, useEffect } from 'react';
import { Typography, Row, Col, Spin } from 'antd';
import AgentCard from '@/components/AgentCard';
import { Agent } from '@/types/agent';
import { getAgents } from '@/app/actions/agent';

const { Title, Paragraph } = Typography;

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const data = await getAgents();
    setAgents(data);
    setLoading(false);
  };

  const categories = Array.from(new Set(agents.map(a => a.category)));

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <Spin size="large" />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Title level={1} className="mb-4">
            AI 数字员工平台
          </Title>
          <Paragraph className="text-lg text-gray-500">
            汇聚企业智能助手，提升工作效率
          </Paragraph>
        </div>

        {/* Agent Grid by Category */}
        {categories.map((category) => {
          const categoryAgents = agents.filter((a) => a.category === category);
          if (categoryAgents.length === 0) return null;

          return (
            <div key={category} className="mb-10">
              <Title level={3} className="mb-4">
                {category}
              </Title>
              <Row gutter={[16, 16]}>
                {categoryAgents.map((agent) => (
                  <Col key={agent.id} xs={24} sm={12} md={8} lg={6}>
                    <AgentCard agent={agent} />
                  </Col>
                ))}
              </Row>
            </div>
          );
        })}

        {agents.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <Paragraph>暂无数字员工，请前往管理后台添加</Paragraph>
          </div>
        )}
      </div>
    </main>
  );
}
