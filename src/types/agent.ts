export interface Agent {
  id: string;              // URL slug
  appId: string;           // 百炼 APP_ID
  name: string;            // Display name
  description: string;     // Short description
  avatar: string;          // Emoji or image URL
  tags: string[];          // Tags for filtering
  category: string;        // Category grouping
}

export interface AgentConfig {
  agents: Agent[];
  categories: string[];
}
