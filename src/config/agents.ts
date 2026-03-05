import { Agent, AgentConfig } from '@/types/agent';

export const agents: Agent[] = [
  {
    id: 'hirely',
    appId: process.env.NEXT_PUBLIC_HIRELY_APP_ID || '',
    name: 'AI招聘数字员工 Hirely',
    description: '智能招聘解决方案，提供JD智能生成、简历智能筛选、员工政策咨询等全流程HR服务',
    avatar: '👤',
    tags: ['招聘', 'HR', 'JD生成'],
    category: '人力资源',
  },
  {
    id: 'atlas',
    appId: process.env.NEXT_PUBLIC_ATLAS_APP_ID || '',
    name: 'AI项目管理数字员工 Atlas',
    description: '企业项目管理的数字仪表盘，具有实时KPI跟踪、风险分析和AI驱动的项目洞察功能',
    avatar: '📊',
    tags: ['项目管理', 'KPI监控', '数据分析'],
    category: '项目管理',
  },
  {
    id: 'nexus',
    appId: process.env.NEXT_PUBLIC_NEXUS_APP_ID || '',
    name: 'AI人力资源数字员工 NEXUS',
    description: '企业级AI人力资源全生命周期数字化管理与智能化决策支持平台',
    avatar: '💼',
    tags: ['人力资源', 'HR管理', '数字化'],
    category: '人力资源',
  },
  {
    id: 'finance',
    appId: process.env.NEXT_PUBLIC_FINANCE_APP_ID || '',
    name: 'AI金融数字员工',
    description: '专业金融服务数字员工，覆盖银行业务、理财规划、保险咨询等场景',
    avatar: '💰',
    tags: ['金融', '银行', '理财'],
    category: '金融',
  },
  {
    id: 'logistics',
    appId: process.env.NEXT_PUBLIC_LOGISTICS_APP_ID || '',
    name: 'AI物流数字员工',
    description: '智能物流解决方案，提供路线优化、仓储管理、配送调度等全链路物流服务支持',
    avatar: '📦',
    tags: ['物流', '配送', '仓储'],
    category: '物流',
  },
  {
    id: 'marketing',
    appId: process.env.NEXT_PUBLIC_MARKETING_APP_ID || '',
    name: 'AI营销数字员工',
    description: '零售营销智能化解决方案，提供精准营销、客户运营、销售转化等全方位营销支持',
    avatar: '📈',
    tags: ['营销', '零售', '电商'],
    category: '营销',
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
