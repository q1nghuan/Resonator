export enum AgentType {
  COMPANION = 'COMPANION', // Empathetic, supportive (Nature article context)
  IDEAL_SELF = 'IDEAL_SELF' // Motivational, reframing, resilience (CHI paper context)
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  PENDING_RESCHEDULE = 'PENDING_RESCHEDULE'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueTime?: string; // ISO string
  status: TaskStatus;
  category: 'work' | 'personal' | 'growth' | 'health';
  durationMinutes: number;
  importance?: 'high' | 'low' | 'medium'; // 重要性：高/中/低
  urgency?: 'high' | 'low' | 'medium'; // 紧急性：高/中/低
}

export interface MoodEntry {
  date: string; // ISO date only YYYY-MM-DD
  score: number; // 1-10
  tags: string[];
  note: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  // If the AI suggests changes, they are attached here
  suggestedActions?: TaskAction[];
}

export type ActionType = 'ADD' | 'UPDATE' | 'DELETE' | 'RESCHEDULE';

export interface TaskAction {
  type: ActionType;
  taskId?: string; // Required for UPDATE/DELETE/RESCHEDULE
  taskData?: Partial<Task>; // For ADD or UPDATE
  reason: string; // Why the AI suggests this
}

export interface AIResponseSchema {
  response_text: string;
  suggested_actions: TaskAction[];
}

export interface AgentPersona {
  name: string;
  description: string;
  systemInstruction: string;
}

export interface UserSettings {
  name: string;
  workStartHour: number;
  workEndHour: number;
  theme: 'light' | 'dark';
  agentPersonas?: {
    [AgentType.COMPANION]: AgentPersona;
    [AgentType.IDEAL_SELF]: AgentPersona;
  };
}

export interface UserHabits {
  preferredWorkTimes: string[]; // 用户偏好的工作时间段
  taskPreferences: {
    preferredDuration: number; // 偏好的任务时长
    preferredCategories: string[]; // 偏好的任务类别
  };
  communicationStyle: string; // 用户的沟通风格
  recentPatterns: string[]; // 最近的模式/习惯
  lastUpdated: number; // 最后更新时间戳
}
