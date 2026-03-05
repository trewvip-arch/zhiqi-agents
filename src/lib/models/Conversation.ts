import mongoose from 'mongoose';
import { Message } from '@/types/conversation';

const messageSchema = new mongoose.Schema<Message>({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    title: { type: String },
    messages: [messageSchema],
    sessionId: { type: String }, // 百炼会话 ID，用于多轮对话
  },
  {
    timestamps: true,
  }
);

// Index for querying conversations by agent, sorted by update time
conversationSchema.index({ agentId: 1, updatedAt: -1 });

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model('Conversation', conversationSchema);

export type ConversationDocumentType = mongoose.Document &
  typeof conversationSchema.methods & {
    agentId: string;
    title?: string;
    messages: Message[];
    sessionId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
