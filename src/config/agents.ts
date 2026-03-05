import { Agent, AgentConfig } from '@/types/agent';

export const agents: Agent[] = [
  {
    id: 'zhiqi',
    appId: '3d27e0bb63db49f9910c1ba80a2478d0',
    name: '智期科技',
    description: '智期科技的大脑，了解并可以回答一切关于智期科技的内容',
    avatar: '🧠',
    tags: ['智期科技', '企业知识', '问答'],
    category: '通用',
  },
];

export const categories = Array.from(new Set(agents.map(a => a.category)));

export const agentConfig: AgentConfig = {
  agents,
  categories,
};

export function getAgentById(id: string): Agent | undefined {
  return agents.find(agent => agent.id === id);
}

export function getAgentsByCategory(category: string): Agent[] {
  return agents.filter(agent => agent.category === category);
}
