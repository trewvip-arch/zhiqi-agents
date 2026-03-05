'use client';

import { Typography, Row, Col } from 'antd';
import AgentCard from '@/components/AgentCard';
import { agents, categories } from '@/config/agents';

const { Title, Paragraph } = Typography;

export default function Home() {
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
      </div>
    </main>
  );
}
