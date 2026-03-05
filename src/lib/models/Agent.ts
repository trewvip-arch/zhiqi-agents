import mongoose from 'mongoose';

export interface AgentDocument {
  _id: string;
  appId: string;
  name: string;
  description: string;
  avatar: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new mongoose.Schema<AgentDocument>(
  {
    appId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    avatar: { type: String, default: '🤖' },
    tags: { type: [String], default: [] },
    category: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite during development
const Agent = mongoose.models.Agent || mongoose.model<AgentDocument>('Agent', AgentSchema);

export default Agent;
