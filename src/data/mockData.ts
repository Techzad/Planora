import { Task, GCalEvent } from "../types";

export const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Finalize Q3 Strategy Presentation",
    description: "Review slides with feedback from directors and add market analysis chart.",
    dueDate: "2026-08-08",
    estimatedMinutes: 90,
    priority: "High",
    status: "Todo",
    category: "Work",
    riskLevel: "Low",
    startTime: "09:00",
    endTime: "10:30",
    subtasks: [
      { id: "sub-1-1", title: "Add competitor comparison slide", completed: true },
      { id: "sub-1-2", title: "Check formatting and font sizes", completed: false },
      { id: "sub-1-3", title: "Re-record rehearsal audio", completed: false }
    ],
    isGCalSynced: false
  },
  {
    id: "task-2",
    title: "Deep Work: Core Engine Refactoring",
    description: "Optimize database lookup speed and clean up the state management hooks.",
    dueDate: "2026-08-08",
    estimatedMinutes: 120,
    priority: "Urgent",
    status: "In Progress",
    category: "Deep Work",
    riskLevel: "Medium",
    startTime: "13:30",
    endTime: "15:30",
    subtasks: [
      { id: "sub-2-1", title: "Refactor useTasks hook", completed: true },
      { id: "sub-2-2", title: "Benchmark search filtering function", completed: false },
      { id: "sub-2-3", title: "Write unit tests for collision helper", completed: false }
    ],
    isGCalSynced: false
  },
  {
    id: "task-3",
    title: "Grocery Shopping & Meal Prep",
    description: "Buy high-protein snacks, fresh vegetables, and prep meals for the week.",
    dueDate: "2026-08-08",
    estimatedMinutes: 60,
    priority: "Low",
    status: "Todo",
    category: "Personal",
    riskLevel: "Low",
    startTime: "17:30",
    endTime: "18:30",
    subtasks: [
      { id: "sub-3-1", title: "List out essential ingredients", completed: false },
      { id: "sub-3-2", title: "Drive to Trader Joe's", completed: false }
    ],
    isGCalSynced: false
  },
  {
    id: "task-4",
    title: "Gym: Upper Body Hypertrophy",
    description: "Focus on chest, shoulders, and triceps progress tracking.",
    dueDate: "2026-08-08",
    estimatedMinutes: 75,
    priority: "Medium",
    status: "Todo",
    category: "Health",
    riskLevel: "Low",
    startTime: "19:00",
    endTime: "20:15",
    subtasks: [
      { id: "sub-4-1", title: "4 sets of Bench Press", completed: false },
      { id: "sub-4-2", title: "3 sets of Lateral Raises", completed: false },
      { id: "sub-4-3", title: "Tricep Pushdowns till failure", completed: false }
    ],
    isGCalSynced: false
  },
  {
    id: "task-5",
    title: "Review Frontend PR on GitHub",
    description: "Analyze the Tailwind CSS components rewrite from Alex.",
    dueDate: "2026-08-09",
    estimatedMinutes: 45,
    priority: "Medium",
    status: "Todo",
    category: "Work",
    riskLevel: "Low",
    startTime: "10:30",
    endTime: "11:15",
    subtasks: [
      { id: "sub-5-1", title: "Checkout Alex's branch locally", completed: false },
      { id: "sub-5-2", title: "Check console for hydration warnings", completed: false }
    ],
    isGCalSynced: false
  },
  {
    id: "task-6",
    title: "Schedule Dentist Checkup",
    description: "Annual cleaning and review dental x-ray results.",
    dueDate: "2026-08-09",
    estimatedMinutes: 30,
    priority: "Low",
    status: "Todo",
    category: "Health",
    riskLevel: "Low",
    subtasks: [],
    isGCalSynced: false
  }
];

export const initialGCalEvents: GCalEvent[] = [
  {
    id: "gcal-1",
    summary: "👥 Team Sync & Standup",
    description: "Daily synchronization of priorities and review blocker logs.",
    start: {
      dateTime: "2026-08-08T11:00:00-07:00"
    },
    end: {
      dateTime: "2026-08-08T12:00:00-07:00"
    },
    colorId: "9" // Lavender/Blue
  },
  {
    id: "gcal-2",
    summary: "🩺 Doctor Appointment",
    description: "Routine health checkup at Oakwood Medical Center.",
    start: {
      dateTime: "2026-08-08T16:00:00-07:00"
    },
    end: {
      dateTime: "2026-08-08T17:00:00-07:00"
    },
    colorId: "11" // Bold red/tomato
  },
  {
    id: "gcal-3",
    summary: "💼 Client Alignment Session",
    description: "Discuss delivery roadmap, review milestones, and clear billing query.",
    start: {
      dateTime: "2026-08-09T14:00:00-07:00"
    },
    end: {
      dateTime: "2026-08-09T15:30:00-07:00"
    },
    colorId: "5" // Yellow/Banana
  }
];
