'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase, isDatabaseConnected } from '@/lib/mongodb';
import Agent, { AgentDocument } from '@/lib/models/Agent';
import { Agent as AgentType } from '@/types/agent';
import { v4 as uuidv4 } from 'uuid';

// In-memory fallback for demo mode
const inMemoryAgents = new Map<string, AgentDocument>();

// Default agents for initial setup
const DEFAULT_AGENTS: AgentDocument[] = [
  {
    _id: 'hirely',
    appId: process.env.NEXT_PUBLIC_HIRELY_APP_ID || '',
    name: 'AI招聘数字员工 Hirely',
    description: '智能招聘解决方案，提供JD智能生成、简历智能筛选、员工政策咨询等全流程HR服务',
    avatar: '👤',
    tags: ['招聘', 'HR', 'JD生成'],
    category: '人力资源',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'atlas',
    appId: process.env.NEXT_PUBLIC_ATLAS_APP_ID || '',
    name: 'AI项目管理数字员工 Atlas',
    description: '企业项目管理的数字仪表盘，具有实时KPI跟踪、风险分析和AI驱动的项目洞察功能',
    avatar: '📊',
    tags: ['项目管理', 'KPI监控', '数据分析'],
    category: '项目管理',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'nexus',
    appId: process.env.NEXT_PUBLIC_NEXUS_APP_ID || '',
    name: 'AI人力资源数字员工 NEXUS',
    description: '企业级AI人力资源全生命周期数字化管理与智能化决策支持平台',
    avatar: '💼',
    tags: ['人力资源', 'HR管理', '数字化'],
    category: '人力资源',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Initialize default agents if empty
function initializeDefaultAgents() {
  if (inMemoryAgents.size === 0) {
    DEFAULT_AGENTS.forEach(agent => {
      inMemoryAgents.set(agent._id, agent);
    });
  }
}

export async function getAgents(): Promise<AgentType[]> {
  const db = await connectToDatabase();

  if (!db || !isDatabaseConnected()) {
    initializeDefaultAgents();
    return Array.from(inMemoryAgents.values()).map(a => ({
      id: a._id,
      appId: a.appId,
      name: a.name,
      description: a.description,
      avatar: a.avatar,
      tags: a.tags,
      category: a.category,
    }));
  }

  const agents = await Agent.find({}).sort({ createdAt: -1 }).lean();
  return agents.map(a => ({
    id: a._id.toString(),
    appId: a.appId,
    name: a.name,
    description: a.description,
    avatar: a.avatar,
    tags: a.tags,
    category: a.category,
  }));
}

export async function getAgentById(id: string): Promise<AgentType | null> {
  const db = await connectToDatabase();

  if (!db || !isDatabaseConnected()) {
    initializeDefaultAgents();
    const agent = inMemoryAgents.get(id);
    if (!agent) return null;
    return {
      id: agent._id,
      appId: agent.appId,
      name: agent.name,
      description: agent.description,
      avatar: agent.avatar,
      tags: agent.tags,
      category: agent.category,
    };
  }

  const agent = await Agent.findById(id).lean();
  if (!agent) return null;
  return {
    id: agent._id.toString(),
    appId: agent.appId,
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar,
    tags: agent.tags,
    category: agent.category,
  };
}

export async function createAgent(data: Omit<AgentType, 'id'>): Promise<AgentType> {
  const db = await connectToDatabase();

  if (!db || !isDatabaseConnected()) {
    const id = uuidv4();
    const agent: AgentDocument = {
      _id: id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryAgents.set(id, agent);
    return { id, ...data };
  }

  const agent = await Agent.create(data);
  revalidatePath('/admin/agents');
  revalidatePath('/');
  return {
    id: agent._id.toString(),
    appId: agent.appId,
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar,
    tags: agent.tags,
    category: agent.category,
  };
}

export async function updateAgent(id: string, data: Omit<AgentType, 'id'>): Promise<AgentType | null> {
  const db = await connectToDatabase();

  if (!db || !isDatabaseConnected()) {
    const agent = inMemoryAgents.get(id);
    if (!agent) return null;
    const updated = { ...agent, ...data, updatedAt: new Date() };
    inMemoryAgents.set(id, updated);
    return { id, ...data };
  }

  const agent = await Agent.findByIdAndUpdate(id, data, { new: true }).lean();
  if (!agent) return null;
  revalidatePath('/admin/agents');
  revalidatePath('/');
  return {
    id: agent._id.toString(),
    appId: agent.appId,
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar,
    tags: agent.tags,
    category: agent.category,
  };
}

export async function deleteAgent(id: string): Promise<boolean> {
  const db = await connectToDatabase();

  if (!db || !isDatabaseConnected()) {
    return inMemoryAgents.delete(id);
  }

  const result = await Agent.findByIdAndDelete(id);
  revalidatePath('/admin/agents');
  revalidatePath('/');
  return !!result;
}

export async function getCategories(): Promise<string[]> {
  const agents = await getAgents();
  return Array.from(new Set(agents.map(a => a.category)));
}
