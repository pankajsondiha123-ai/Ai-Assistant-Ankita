export type JarvisIntent =
  | 'chat'
  | 'device_control'
  | 'phone_call'
  | 'send_message'
  | 'open_app'
  | 'search'
  | 'weather_report'
  | 'world_knowledge'
  | 'timer'
  | 'notes';

export interface ActiveAction {
  id: string;
  type: 'whatsapp' | 'call' | 'sms' | 'torch' | 'timer' | 'app' | 'search' | 'weather' | 'battery' | 'notes';
  title: string;
  subtitle: string;
  payload?: any;
  actionUrl?: string;
  actionButtonText?: string;
  status: 'running' | 'completed';
  timestamp: string;
}

export interface JarvisParameters {
  receiver?: string;
  message_text?: string;
  platform?: string;
  app_name?: string;
  query?: string;
  city?: string;
  time?: string;
  [key: string]: any;
}

export interface LongTermMemory {
  identity: Record<string, { value: any; updated_at?: string }>;
  preferences: Record<string, { value: any; updated_at?: string }>;
  relationships: Record<string, { name?: { value: string }; relation?: string; updated_at?: string }>;
  emotional_state: Record<string, { value: any; updated_at?: string }>;
}

export interface TemporaryMemory {
  pending_intent: JarvisIntent | null;
  parameters: JarvisParameters;
  current_question: string | null;
  last_user_text: string | null;
  last_ai_response: string | null;
  last_search: { query: string; answer: string } | null;
  last_opened_app: string | null;
  conversation_history: Array<{ role: 'user' | 'ai'; text: string; timestamp: string }>;
}

export interface JarvisResponse {
  intent: JarvisIntent;
  parameters: JarvisParameters;
  needs_clarification: boolean;
  text: string;
  memory_update?: Partial<LongTermMemory> | null;
}

export interface LogEntry {
  id: string;
  type: 'user' | 'ai' | 'system' | 'action' | 'warning';
  text: string;
  timestamp: string;
  details?: any;
}

export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';
