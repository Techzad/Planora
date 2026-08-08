export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Todo' | 'In Progress' | 'Completed';
export type Category = 'Work' | 'Personal' | 'Health' | 'Deep Work';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // e.g. "2026-08-08" or "2026-08-09"
  estimatedMinutes: number;
  priority: Priority;
  status: TaskStatus;
  category: Category;
  riskLevel: RiskLevel;
  subtasks: SubTask[];
  isGCalSynced: boolean;
  gCalEventId?: string;
  startTime?: string; // e.g. "09:00"
  endTime?: string;   // e.g. "10:30"
}

export interface GCalEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  colorId?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
