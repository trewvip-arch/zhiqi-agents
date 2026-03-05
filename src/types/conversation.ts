export interface MessageFile {
  url: string;
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  files?: MessageFile[]; // 用户消息的文件附件
}

export interface ConversationDocument {
  _id: string;
  agentId: string;
  title?: string;
  messages: Message[];
  sessionId?: string; // 百炼会话 ID，用于多轮对话上下文
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationInput {
  agentId: string;
  title?: string;
}

export interface AddMessageInput {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
}
