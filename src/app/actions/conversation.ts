'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/mongodb';
import { Conversation } from '@/lib/models/Conversation';
import { Message } from '@/types/conversation';

export async function createConversation(agentId: string) {
  await connectToDatabase();

  const conversation = await Conversation.create({
    agentId,
    messages: [],
  });

  return conversation._id.toString();
}

export async function getConversation(conversationId: string) {
  await connectToDatabase();

  const conversation = await Conversation.findById(conversationId).lean();

  if (!conversation) {
    return null;
  }

  return {
    _id: conversation._id.toString(),
    agentId: conversation.agentId,
    title: conversation.title,
    messages: conversation.messages.map((m: Message) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export async function getConversationsByAgent(agentId: string) {
  await connectToDatabase();

  const conversations = await Conversation.find({ agentId })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  return conversations.map((c) => ({
    _id: c._id.toString(),
    agentId: c.agentId,
    title: c.title,
    messageCount: c.messages.length,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  await connectToDatabase();

  const message: Message = {
    id: uuidv4(),
    role,
    content,
    createdAt: new Date(),
  };

  const updateData: Record<string, unknown> = {
    $push: { messages: message },
    updatedAt: new Date(),
  };

  // Set title from first user message
  const conversation = await Conversation.findById(conversationId);
  if (conversation && !conversation.title && role === 'user') {
    updateData.$set = { title: content.slice(0, 50) };
  }

  await Conversation.findByIdAndUpdate(conversationId, updateData);

  revalidatePath(`/chat/${conversation?.agentId}/${conversationId}`);

  return message;
}

export async function deleteConversation(conversationId: string) {
  await connectToDatabase();
  await Conversation.findByIdAndDelete(conversationId);
}
