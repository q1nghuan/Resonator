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

export interface UserSettings {
  name: string;
  workStartHour: number;
  workEndHour: number;
  theme: 'light' | 'dark';
}
