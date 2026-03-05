'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import { Agent as AgentType } from '@/types/agent';

// Default agent for initial seeding
const DEFAULT_AGENT = {
  appId: '3d27e0bb63db49f9910c1ba80a2478d0',
  name: '智期科技',
  description: '智期科技的大脑，了解并可以回答一切关于智期科技的内容',
  avatar: '🧠',
  tags: ['智期科技', '企业知识', '问答'],
  category: '通用',
};

// Seed database with default agent if empty
async function seedDatabaseIfEmpty() {
  const count = await Agent.countDocuments();
  if (count === 0) {
    console.log('[Agent] Seeding database with default agent...');
    await Agent.create(DEFAULT_AGENT);
  }
}

export async function getAgents(): Promise<AgentType[]> {
  await connectToDatabase();
  await seedDatabaseIfEmpty();

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
  await connectToDatabase();

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
  await connectToDatabase();

  // Ensure category is a string (form may send array)
  const category = Array.isArray(data.category) ? data.category[0] : data.category;

  const agent = await Agent.create({
    ...data,
    category,
  });
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
  await connectToDatabase();

  // Ensure category is a string (form may send array)
  const category = Array.isArray(data.category) ? data.category[0] : data.category;

  const agent = await Agent.findByIdAndUpdate(id, { ...data, category }, { new: true }).lean();
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
  await connectToDatabase();

  const result = await Agent.findByIdAndDelete(id);
  revalidatePath('/admin/agents');
  revalidatePath('/');
  return !!result;
}

export async function getCategories(): Promise<string[]> {
  const agents = await getAgents();
  return Array.from(new Set(agents.map(a => a.category)));
}
