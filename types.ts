
import React from 'react';

export type SessionStatus = 'backlog' | 'todo' | 'in_progress' | 'needs_review' | 'done' | 'cancelled' | 'archive';
export type SessionMode = 'explore' | 'execute' | 'council';
export type ColorTheme = 'Default' | 'Catppuccin' | 'Dracula' | 'Ghostty' | 'GitHub' | 'Gruvbox' | 'Haze' | 'Tokyo Night' | 'Solarized' | 'Rose Pine' | 'AAITN' | 'One Dark Pro' | 'Pierre' | 'Nord' | 'Retina' | 'Nerf Gun' | 'Nightfall' | 'City' | 'Yogurt' | 'Appwrite' | 'Jacob';
export type FontFamily = 'Inter' | 'System';

export interface Label {
  id: string;
  name: string;
  color: string; // hex code
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64
  size: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  thoughtProcess?: string;
  model?: string; // Track which model generated this specific message
}

export interface Session {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  category: 'TODAY' | 'YESTERDAY' | 'PREVIOUS';
  status: SessionStatus;
  labelIds: string[];
  tasks?: Task[];
  isSelected?: boolean;
  hasNewResponse?: boolean;
  isFlagged?: boolean;
  mode?: SessionMode;
  councilModels?: string[];
}

export interface AgentTool {
  id: string;
  type: 'mcp' | 'api_linear' | 'api_github' | 'api_custom';
  name: string;
  config: string; // URL or API Key
  active: boolean;
}

export interface Agent {
  id: string;
  name: string;
  baseModel: string;
  systemInstruction: string;
  description?: string;
  icon?: string; // base64 string for custom agent icon
  tools?: AgentTool[];
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  colorTheme: ColorTheme;
  fontFamily: FontFamily;
  accentColor: string;
  workspaceName: string;
  workspaceIcon?: string; // base64
  visibleModels: string[];
  defaultModel: string; // Default model for system actions (titles, etc) or fallback
  userName: string;
  timezone: string;
  language: string;
  city: string;
  country: string;
  baseKnowledge: string;
  sendKey: 'Enter' | 'Ctrl+Enter';
  onboardingComplete: boolean;
  enableTasks: boolean;
  apiKeys: {
      gemini: string;
      openRouter: string;
      openRouterAlt: string;
      routeway: string;
      scira: string;
      exa: string;
      tavily: string;
  };
}

export const OPENROUTER_FREE_MODELS = [
    'stepfun/step-3.5-flash:free',
    'liquid/lfm-2.5-1.2b-thinking:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'arcee-ai/trinity-mini:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'qwen/qwen3-coder:free',
    'google/gemma-3n-e2b-it:free',
    'mistralai/mistral-small-3.1-24b-instruct:free'
];

export const GEMINI_MODELS = [
    'gemini-3-flash-preview', 
    'gemini-3-pro-preview', 
    'gemini-flash-latest',
    'gemini-flash-lite-latest'
];

export const ROUTEWAY_MODELS = [
    'devstral-2512:free',
    'kimi-k2-0905:free',
    'nemotron-nano-9b-v2:free',
    'gpt-oss-120b:free',
    'glm-4.5-air:free',
    'deepseek-r1-0528:free',
    'deepseek-r1:free',
    'deepseek-r1-distill-qwen-32b:free',
    'llama-3.2-3b-instruct:free',
    'llama-3.1-8b-instruct:free',
    'mistral-nemo-instruct:free'
];

export const SCIRA_MODELS = []; // Deprecated as models, now a tool

export const MODEL_FRIENDLY_NAMES: Record<string, string> = {
    // Gemini
    'gemini-3-flash-preview': 'Gemini 3 Flash',
    'gemini-3-pro-preview': 'Gemini 3 Pro',
    'gemini-flash-latest': 'Gemini 2.5 Flash',
    'gemini-flash-lite-latest': 'Gemini 2.5 Flash Lite',
    
    // OpenRouter
    'stepfun/step-3.5-flash:free': 'Step 3.5 Flash',
    'liquid/lfm-2.5-1.2b-thinking:free': 'Liquid LFM 2.5',
    'nvidia/nemotron-3-nano-30b-a3b:free': 'Nemotron 3 Nano',
    'arcee-ai/trinity-mini:free': 'Trinity Mini',
    'nvidia/nemotron-nano-12b-v2-vl:free': 'Nemotron Nano 12B',
    'qwen/qwen3-next-80b-a3b-instruct:free': 'Qwen 3 Next 80B',
    'qwen/qwen3-coder:free': 'Qwen 3 Coder',
    'google/gemma-3n-e2b-it:free': 'Gemma 3N',
    'mistralai/mistral-small-3.1-24b-instruct:free': 'Mistral Small 3.1',
    
    // Routeway
    'devstral-2512:free': 'Devstral 2512',
    'kimi-k2-0905:free': 'Kimi K2',
    'nemotron-nano-9b-v2:free': 'Nemotron Nano 9B',
    'gpt-oss-120b:free': 'GPT OSS 120B',
    'glm-4.5-air:free': 'GLM 4.5 Air',
    'deepseek-r1-0528:free': 'DeepSeek R1 (0528)',
    'deepseek-r1:free': 'DeepSeek R1',
    'deepseek-r1-distill-qwen-32b:free': 'DeepSeek R1 Distill',
    'llama-3.2-3b-instruct:free': 'Llama 3.2 3B',
    'llama-3.1-8b-instruct:free': 'Llama 3.1 8B',
    'mistral-nemo-instruct:free': 'Mistral Nemo'
};
