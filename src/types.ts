export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  aiGenerated?: boolean;
  executionOutput?: string | null; // e.g., outline, template code, or email draft
}

export interface TimeBlock {
  start: string; // ISO string or simple time like "09:00"
  end: string;   // ISO string or simple time like "10:00"
  date: string;  // YYYY-MM-DD
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO date string or YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  category: string;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  subtasks: SubTask[];
  timeBlock: TimeBlock | null;
  aiReasoning?: string;
  createdTime: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  completed: boolean;
  progress: number; // 0 to 100
  tasksAssigned: string[]; // Task IDs supporting this goal
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompleted: string | null; // YYYY-MM-DD
  history: { [date: string]: boolean }; // e.g., "2026-06-29": true
}

export interface ProductivityRecommendation {
  id: string;
  type: 'warning' | 'tip' | 'schedule' | 'encouragement';
  title: string;
  text: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
}
