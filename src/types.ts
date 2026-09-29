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

export type UserRole = 'admin' | 'operator' | 'user';
export type ActivityStatus = 'online' | 'idle' | 'offline';

export interface UserPermissions {
  canUseVoice: boolean;
  canUseAiChat: boolean;
  canUseDeviceControls: boolean;
  canUseVisionOcr: boolean;
  canUseAutomations: boolean;
  isBanned: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: ActivityStatus;
  lastActive: string;
  registeredAt: string;
  loginCount: number;
  permissions: UserPermissions;
  ipAddress?: string;
  device?: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  category: 'auth' | 'admin' | 'ai' | 'device' | 'security' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  details?: string;
}

export interface SystemSettings {
  aiTone: 'loving' | 'professional' | 'creative' | 'concise';
  temperature: number;
  maintenanceMode: boolean;
  lockdownMode: boolean;
  globalAnnouncement: string;
  requireAuthToUse: boolean;
  maxRequestsPerUser: number;
  allowNewRegistrations: boolean;
}

