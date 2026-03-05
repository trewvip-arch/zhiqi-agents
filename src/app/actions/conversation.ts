'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase, isDatabaseConnected } from '@/lib/mongodb';
import { Conversation } from '@/lib/models/Conversation';
import { Message, ConversationDocument } from '@/types/conversation';

// In-memory fallback for demo mode when MongoDB is not available
const inMemoryConversations = new Map<string, ConversationDocument>();

function generateId(): string {
  return uuidv4();
}

export async function createConversation(agentId: string) {
  const db = await connectToDatabase();

  if (!db || !isDatabaseConnected()) {
    // Fallback to in-memory storage
    const id = generateId();
    const conversation: ConversationDocument = {
      _id: id,
      agentId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryConversations.set(id, conversation);
    return id;
  }

  const conversation = await Conversation.create({
    agentId,
    messages: [],
  });

  return conversation._id.toString();
}

export async function getConversation(conversationId: string) {
  const db = await connectToDatabase();

  if (!db || !isDatabaseConnected()) {
    // Fallback to in-memory storage
    const conversation = inMemoryConversations.get(conversationId);
    if (!conversation) {
      return null;
    }
    return {
      _id: conversation._id,
      agentId: conversation.agentId,
      title: conversation.title,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

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
  const db = await connectToDatabase();

  if (!db || !isDatabaseConnected()) {
    // Fallback to in-memory storage
    const conversations = Array.from(inMemoryConversations.values())
      .filter(c => c.agentId === agentId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 20);

    return conversations.map((c) => ({
      _id: c._id,
      agentId: c.agentId,
      title: c.title,
      messageCount: c.messages.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

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
  const db = await connectToDatabase();

  const message: Message = {
    id: uuidv4(),
    role,
    content,
    createdAt: new Date(),
  };

  if (!db || !isDatabaseConnected()) {
    // Fallback to in-memory storage
    const conversation = inMemoryConversations.get(conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.updatedAt = new Date();
      if (!conversation.title && role === 'user') {
        conversation.title = content.slice(0, 50);
      }
    }
    return message;
  }

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
  const db = await connectToDatabase();

  if (!db || !isDatabaseConnected()) {
    // Fallback to in-memory storage
    inMemoryConversations.delete(conversationId);
    return;
  }

  await Conversation.findByIdAndDelete(conversationId);
}
