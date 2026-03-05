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
    _id: 'zhiqi',
    appId: '3d27e0bb63db49f9910c1ba80a2478d0',
    name: '智期科技',
    description: '智期科技的大脑，了解并可以回答一切关于智期科技的内容',
    avatar: '🧠',
    tags: ['智期科技', '企业知识', '问答'],
    category: '通用',
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
