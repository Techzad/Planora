import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import DailyTimeline from "./components/DailyTimeline";
import TaskCard from "./components/TaskCard";
import SortableTaskCard from "./components/SortableTaskCard";
import AIAdvisor from "./components/AIAdvisor";
import TaskEditModal from "./components/TaskEditModal";
import KanbanBoard from "./components/KanbanBoard";
import CalendarView from "./components/CalendarView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import LandingView from "./components/LandingView";

import { Task, GCalEvent, ChatMessage, TaskStatus, SubTask } from "./types";
import { initialTasks, initialGCalEvents } from "./data/mockData";
import { detectConflicts, parseIsoDateTime } from "./utils/scheduler";
import { Filter, CalendarRange, Sparkles, CheckSquare, Plus, CheckCircle, Clock } from "lucide-react";

import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, onSnapshot, query, where, writeBatch, deleteDoc } from "firebase/firestore";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export default function App() {
  // Navigation & Core States
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [streak, setStreak] = useState(5);
  const [selectedDate, setSelectedDate] = useState("2026-08-08");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  // Scheduler & Task States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [gCalEvents, setGCalEvents] = useState<GCalEvent[]>([]);

  // GCal OAuth Integration States
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [userGCalEmail, setUserGCalEmail] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Modal / Interaction States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Advisor / AI States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Settings States
  const [workdayStart, setWorkdayStart] = useState("06:00");
  const [workdayEnd, setWorkdayEnd] = useState("22:00");
  const [defaultTaskDuration, setDefaultTaskDuration] = useState(60);

  // Active filters
  const [filterType, setFilterType] = useState<"All" | "Local" | "Calendar">("All");

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Load initial caching and handle Firebase Auth listener
  useEffect(() => {
    const cachedConnected = localStorage.getItem("aura_gcal_connected");
    const cachedEmail = localStorage.getItem("aura_gcal_email");

    if (cachedConnected === "true") {
      setIsGCalConnected(true);
      setUserGCalEmail(cachedEmail || "techseries358@gmail.com");
    }

    // Set up real-time Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const u = {
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || ""
        };
        setCurrentUser(u);

        // Fetch user preferences / settings from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.streak !== undefined) setStreak(data.streak);
            if (data.workdayStart !== undefined) setWorkdayStart(data.workdayStart);
            if (data.workdayEnd !== undefined) setWorkdayEnd(data.workdayEnd);
            if (data.defaultTaskDuration !== undefined) setDefaultTaskDuration(data.defaultTaskDuration);
            if (data.theme !== undefined) {
              setIsDarkMode(data.theme === "dark");
            }
          } else {
            // Seed/initialize user document in Firestore
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              name: u.name,
              email: u.email,
              streak: 5,
              workdayStart: "06:00",
              workdayEnd: "22:00",
              defaultTaskDuration: 60,
              theme: "dark",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Error fetching user profile from Firestore:", err);
        }
      } else {
        setCurrentUser(null);
        setTasks([]);
        setGCalEvents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-save settings to Firestore in real-time when they change
  useEffect(() => {
    if (!currentUser || !auth.currentUser) return;
    const saveSettings = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser!.uid);
        await setDoc(userRef, {
          uid: auth.currentUser!.uid,
          name: currentUser.name,
          email: currentUser.email,
          streak,
          workdayStart,
          workdayEnd,
          defaultTaskDuration,
          theme: isDarkMode ? "dark" : "light",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error auto-saving settings to Firestore:", err);
      }
    };
    saveSettings();
  }, [workdayStart, workdayEnd, defaultTaskDuration, isDarkMode, streak, currentUser]);

  // Real-time listen for Tasks and GCal Events from Firestore
  useEffect(() => {
    if (!currentUser || !auth.currentUser) {
      setTasks([]);
      setGCalEvents([]);
      return;
    }

    const userId = auth.currentUser.uid;

    // Real-time listen for Tasks
    const tasksQuery = query(collection(db, "tasks"), where("userId", "==", userId));
    const unsubscribeTasks = onSnapshot(tasksQuery, async (snapshot) => {
      if (snapshot.empty) {
        // If there are zero tasks, seed the user's view with initialTasks and initialGCalEvents
        const batch = writeBatch(db);
        initialTasks.forEach((task) => {
          const taskRef = doc(db, "tasks", task.id);
          batch.set(taskRef, {
            ...task,
            userId: userId
          });
        });
        initialGCalEvents.forEach((evt) => {
          const evtRef = doc(db, "gcal_events", evt.id);
          batch.set(evtRef, {
            ...evt,
            userId: userId
          });
        });
        try {
          await batch.commit();
        } catch (err) {
          console.error("Error seeding initial tasks in Firestore:", err);
        }
      } else {
        const loadedTasks: Task[] = [];
        snapshot.forEach((doc) => {
          loadedTasks.push(doc.data() as Task);
        });
        setTasks(loadedTasks);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "tasks");
    });

    // Real-time listen for Google Calendar Events cache
    const eventsQuery = query(collection(db, "gcal_events"), where("userId", "==", userId));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const loadedEvents: GCalEvent[] = [];
      snapshot.forEach((doc) => {
        loadedEvents.push(doc.data() as GCalEvent);
      });
      setGCalEvents(loadedEvents);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "gcal_events");
    });

    return () => {
      unsubscribeTasks();
      unsubscribeEvents();
    };
  }, [currentUser]);

  // Scroll to top when tab or user status changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentUser, currentTab]);

  // Save changes to localStorage helper
  const handleToggleTheme = () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    localStorage.setItem("aura_theme", nextVal ? "dark" : "light");
    showToast(`Switched to ${nextVal ? "Dark" : "Light"} Mode`, "info");
  };

  const handleLoginSuccess = (user: { name: string; email: string }) => {
    setCurrentUser(user);
    showToast(`Welcome to Planora, ${user.name}!`, "success");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleLogout = async () => {
    localStorage.removeItem("aura_user");
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase signOut error:", err);
    }
    setCurrentUser(null);
    showToast("Signed out successfully", "info");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const saveTasksToStorage = async (updatedTasks: Task[]) => {
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const batch = writeBatch(db);
      
      const currentIds = new Set(updatedTasks.map(t => t.id));
      const deletedTasks = tasks.filter(t => !currentIds.has(t.id));
      
      deletedTasks.forEach((t) => {
        const docRef = doc(db, "tasks", t.id);
        batch.delete(docRef);
      });

      updatedTasks.forEach((t) => {
        const docRef = doc(db, "tasks", t.id);
        batch.set(docRef, {
          ...t,
          userId: userId
        });
      });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "tasks");
      }
    } else {
      setTasks(updatedTasks);
      const key = currentUser ? `aura_tasks_${currentUser.email}` : "aura_tasks";
      localStorage.setItem(key, JSON.stringify(updatedTasks));
    }
  };

  // Drag and Drop sensor configurations
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reorder active task queue
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentQueueTasks = tasks.filter((t) => {
      const dateMatches = t.dueDate === selectedDate;
      if (filterType === "Local" && t.isGCalSynced) return false;
      return dateMatches && t.status !== "Completed";
    });

    const oldIndex = currentQueueTasks.findIndex((t) => t.id === activeId);
    const newIndex = currentQueueTasks.findIndex((t) => t.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const updatedTasks = [...tasks];
      // Find the indices of each queue task in the main `tasks` array
      const mainIndices = currentQueueTasks.map(qt => tasks.findIndex(t => t.id === qt.id));
      // Reordered queue items
      const reorderedQueue = arrayMove(currentQueueTasks, oldIndex, newIndex);
      // Place reordered items back at those specific main indices
      mainIndices.forEach((mainIdx, queueIdx) => {
        updatedTasks[mainIdx] = reorderedQueue[queueIdx];
      });

      saveTasksToStorage(updatedTasks);
      showToast("Task queue order updated", "success");
    }
  };

  const saveGCalEventsToStorage = async (updatedEvents: GCalEvent[]) => {
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const batch = writeBatch(db);
      
      const currentIds = new Set(updatedEvents.map(e => e.id));
      const deletedEvents = gCalEvents.filter(e => !currentIds.has(e.id));
      
      deletedEvents.forEach((e) => {
        const docRef = doc(db, "gcal_events", e.id);
        batch.delete(docRef);
      });

      updatedEvents.forEach((e) => {
        const docRef = doc(db, "gcal_events", e.id);
        batch.set(docRef, {
          ...e,
          userId: userId
        });
      });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "gcal_events");
      }
    } else {
      setGCalEvents(updatedEvents);
      const key = currentUser ? `aura_gcal_events_${currentUser.email}` : "aura_gcal_events";
      localStorage.setItem(key, JSON.stringify(updatedEvents));
    }
  };

  // Helper for displaying notifications
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // CRUD Operations
  const handleSaveTask = (savedTask: Task) => {
    const exists = tasks.some((t) => t.id === savedTask.id);
    let updatedTasks: Task[];
    if (exists) {
      updatedTasks = tasks.map((t) => (t.id === savedTask.id ? savedTask : t));
      showToast(`Updated task: "${savedTask.title}"`);
    } else {
      updatedTasks = [savedTask, ...tasks];
      showToast(`Created new task: "${savedTask.title}"`);
    }
    saveTasksToStorage(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    saveTasksToStorage(updatedTasks);
    if (taskToDelete) {
      showToast(`Deleted task: "${taskToDelete.title}"`, "info");
    }
  };

  const handleToggleComplete = (taskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus: TaskStatus = t.status === "Completed" ? "Todo" : "Completed";
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTasksToStorage(updatedTasks);
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    saveTasksToStorage(updatedTasks);
    showToast(`Shifted status to: ${status}`, "info");
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const updatedSubs = t.subtasks.map((sub) =>
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        return { ...t, subtasks: updatedSubs };
      }
      return t;
    });
    saveTasksToStorage(updatedTasks);
  };

  // Google Calendar Connectivity Trigger (OAuth 2.0 flow using GIS client)
  const handleConnectGCal = () => {
    const gWindow = window as any;
    if (gWindow.google && gWindow.google.accounts && gWindow.google.accounts.oauth2) {
      const tokenClient = gWindow.google.accounts.oauth2.initTokenClient({
        client_id: "29875603071-6j5vhaqhtal9d4u61qa26t05b9b772vk.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/calendar.events",
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            localStorage.setItem("gcal_access_token", tokenResponse.access_token);
            localStorage.setItem("gcal_gcal_connected", "true");
            localStorage.setItem("gcal_gcal_email", "techseries358@gmail.com");

            setIsGCalConnected(true);
            setUserGCalEmail("techseries358@gmail.com");
            setLastSyncedTime(new Date().toLocaleTimeString());
            showToast("Authenticated successfully with Google Calendar!");

            // Automatically fetch real user GCal events upon connection
            await handleSyncGCalEvents(tokenResponse.access_token);
          }
        },
      });
      tokenClient.requestAccessToken();
    } else {
      showToast("Google Identity Services script is loading. Try opening the app in a new tab if authorization popups are blocked.", "error");
    }
  };

  const handleDisconnectGCal = () => {
    localStorage.removeItem("gcal_access_token");
    localStorage.removeItem("gcal_gcal_connected");
    localStorage.removeItem("gcal_gcal_email");

    setIsGCalConnected(false);
    setUserGCalEmail(null);
    setLastSyncedTime(null);
    setGCalEvents(initialGCalEvents); // Rollback to preloaded mock GCal events
    showToast("Disconnected Google Calendar.", "info");
  };

  const handleSyncGCalEvents = async (customToken?: string) => {
    const token = customToken || localStorage.getItem("gcal_access_token");
    if (!token) {
      showToast("Please authorize/connect Google Calendar first!", "error");
      return;
    }

    setIsSyncing(true);
    try {
      // Fetch 1-week calendar event slice
      const timeMin = new Date("2026-08-05T00:00:00Z").toISOString();
      const timeMax = new Date("2026-08-11T23:59:59Z").toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Calendar query rejected by Google APIs");
      }

      const data = await response.json();
      if (data.items) {
        const fetchedList: GCalEvent[] = data.items.map((item: any) => ({
          id: item.id,
          summary: item.summary || "Untitled Event",
          description: item.description || "",
          start: {
            dateTime: item.start?.dateTime || item.start?.date,
            date: item.start?.date,
          },
          end: {
            dateTime: item.end?.dateTime || item.end?.date,
            date: item.end?.date,
          },
          colorId: item.colorId || "9"
        }));

        saveGCalEventsToStorage(fetchedList);
        setLastSyncedTime(new Date().toLocaleTimeString());
        showToast(`Synced ${fetchedList.length} events from your Google Calendar!`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to sync calendar: ${err.message}`, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Push Individual local Task to GCal
  const handlePushTaskToGCal = async (task: Task) => {
    const token = localStorage.getItem("gcal_access_token");
    if (!isGCalConnected || !token) {
      showToast("Please connect to Google Calendar first to publish events!", "error");
      return;
    }

    try {
      const sHour = task.startTime || "09:00";
      const eHour = task.endTime || "10:00";

      const body = {
        summary: `🎯 ${task.title}`,
        description: `${task.description || ""}\n\nPriority: ${task.priority}\nCategory: ${task.category}\n\nScheduled automatically via Planora.`,
        start: {
          dateTime: `${task.dueDate}T${sHour}:00`,
          timeZone: "America/Los_Angeles"
        },
        end: {
          dateTime: `${task.dueDate}T${eHour}:00`,
          timeZone: "America/Los_Angeles"
        }
      };

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        throw new Error("Failed to insert event into Google Calendar");
      }

      const created = await response.json();
      const updatedTasks = tasks.map((t) =>
        t.id === task.id ? { ...t, isGCalSynced: true, gCalEventId: created.id } : t
      );
      saveTasksToStorage(updatedTasks);
      showToast(`Pushed "${task.title}" to Google Calendar successfully!`);
    } catch (err: any) {
      console.error(err);
      showToast(`GCal upload failed: ${err.message}`, "error");
    }
  };

  // Batch sync schedule to Google Calendar (Insert all unsynced task blocks)
  const handleBatchSyncToGCal = async () => {
    const unsynced = tasks.filter((t) => t.dueDate === selectedDate && !t.isGCalSynced && t.startTime && t.status !== "Completed");
    if (unsynced.length === 0) {
      showToast("No unsynced tasks found on today's schedule.", "info");
      return;
    }

    showToast(`Pushing ${unsynced.length} scheduled task blocks to Google Calendar...`, "info");
    for (const t of unsynced) {
      await handlePushTaskToGCal(t);
    }
  };

  // AI-Powered Natural Language Parser Trigger
  const handleSmartAddTask = async (prompt: string) => {
    try {
      const response = await fetch("/api/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, clientTime: `${selectedDate}T12:00:00-07:00` }),
      });

      if (!response.ok) throw new Error("Server rejected natural task parse query");
      const parsed = await response.json();

      if (parsed && parsed.title) {
        const newTask: Task = {
          id: "parsed-task-" + Date.now(),
          title: parsed.title,
          description: parsed.description || "",
          dueDate: parsed.dueDate || selectedDate,
          estimatedMinutes: parsed.estimatedMinutes || defaultTaskDuration,
          priority: parsed.priority || "Medium",
          status: "Todo",
          category: parsed.category || "Work",
          riskLevel: parsed.priority === "Urgent" || parsed.priority === "High" ? "High" : "Low",
          startTime: parsed.startTime || undefined,
          endTime: parsed.endTime || undefined,
          subtasks: (parsed.subtasks || []).map((sub: any, idx: number) => ({
            id: `sub-parsed-${Date.now()}-${idx}`,
            title: sub.title || sub,
            completed: false
          })),
          isGCalSynced: false
        };

        saveTasksToStorage([newTask, ...tasks]);
        showToast(`Parsed & Added: "${newTask.title}"`);
      } else {
        showToast("Parser returned empty details. Standard task creation recommended.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Smart Add failed: ${err.message}`, "error");
    }
  };

  // AI Subtasks Generator
  const handleGenerateAISubtasks = async (title: string, description: string): Promise<SubTask[]> => {
    try {
      const response = await fetch("/api/generate-subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description })
      });
      if (!response.ok) throw new Error("Subtask endpoint returned an error");
      const list = await response.json();
      return (list || []).map((item: any, idx: number) => ({
        id: `subtask-ai-${Date.now()}-${idx}`,
        title: item.title || item,
        completed: false
      }));
    } catch (err) {
      console.error(err);
      showToast("Could not generate steps with AI.", "error");
      return [];
    }
  };

  // AI Workload Auto-Scheduler (Optimized around GCal events)
  const handleAutoScheduleDay = async () => {
    setIsAutoScheduling(true);
    try {
      const response = await fetch("/api/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter((t) => t.status !== "Completed" && t.dueDate === selectedDate),
          gCalEvents,
          clientTime: selectedDate
        })
      });

      if (!response.ok) throw new Error("Failed to consult GCal-Aware auto scheduler");
      const result = await response.json();

      if (result.tasks) {
        // Merge completed/past tasks that shouldn't be altered
        const unalteredTasks = tasks.filter((t) => t.status === "Completed" || t.dueDate !== selectedDate);
        const merged: Task[] = [...unalteredTasks];

        result.tasks.forEach((opt: Task) => {
          merged.push(opt);
        });

        saveTasksToStorage(merged);

        // Append AI planning logs into Coach chat advisor
        if (result.advice) {
          setChatHistory((prev) => [
            ...prev,
            {
              role: "model",
              content: `✨ **Schedule Re-Optimized around Google Calendar**\n\n${result.advice}`,
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }
        showToast("Auto-Scheduled tasks successfully around Google Calendar events!");
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Scheduler Error: ${err.message}`, "error");
    } finally {
      setIsAutoScheduling(false);
    }
  };

  // Coach Advisor chat proxy message handler
  const handleSendChatAdvice = async (message: string) => {
    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsGeneratingAdvice(true);

    try {
      const response = await fetch("/api/workload-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          gCalEvents,
          chatHistory: [...chatHistory, userMsg],
          message,
          clientTime: selectedDate
        })
      });

      if (!response.ok) throw new Error("Advice endpoint query failed");
      const result = await response.json();

      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          content: result.response || "No response received",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          content: "⚠️ The Workload Advice model experienced an issue. Please verify your GEMINI_API_KEY environment configuration.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const handleResetData = async () => {
    localStorage.clear();
    setIsGCalConnected(false);
    setUserGCalEmail(null);
    setLastSyncedTime(null);
    setChatHistory([]);
    setSelectedDate("2026-08-08");

    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const batch = writeBatch(db);

      tasks.forEach((t) => {
        const docRef = doc(db, "tasks", t.id);
        batch.delete(docRef);
      });

      gCalEvents.forEach((e) => {
        const docRef = doc(db, "gcal_events", e.id);
        batch.delete(docRef);
      });

      try {
        await batch.commit();
        showToast("Cloud database reset completed.", "info");
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, "tasks");
      }
    } else {
      setTasks(initialTasks);
      setGCalEvents(initialGCalEvents);
      showToast("Application states cleared to preloaded mock templates.", "info");
    }
  };

  // Computations
  const conflicts = detectConflicts(tasks, gCalEvents, selectedDate);
  const activeUnscheduledCount = tasks.filter((t) => t.dueDate === selectedDate && !t.startTime && t.status !== "Completed").length;

  return (
    <div id="app-root" className={`min-h-screen theme-bg theme-text flex font-sans transition-colors duration-200 ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      {/* Toast Notification */}
      {toast && (
        <div
          id="toast-notification"
          className={`fixed top-6 right-6 px-4 py-3 rounded-xl border shadow-2xl z-50 flex items-center space-x-2.5 animate-slide-in-right font-medium text-xs backdrop-blur-md ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : toast.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{toast.message}</span>
        </div>
      )}

      {!currentUser ? (
        <LandingView onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} />
      ) : (
        <>
          {/* Sidebar Navigation */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            streak={streak}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          isGCalConnected={isGCalConnected}
          userGCalEmail={userGCalEmail}
          lastSynced={lastSyncedTime}
          onConnectGCal={handleConnectGCal}
          onSyncGCal={() => handleSyncGCalEvents()}
          onAutoSchedule={handleAutoScheduleDay}
          onSmartAddTask={handleSmartAddTask}
          isAutoScheduling={isAutoScheduling}
          isSyncing={isSyncing}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />

        <main className="flex-1 p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {/* TAB 1: OVERVIEW (Main Dashboard) */}
          {currentTab === "dashboard" && (
            <div className="space-y-6">
              {/* Dashboard metrics statistics row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="frosted-glass rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-md indigo-glow">
                    📝
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Today's Active Tasks</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {tasks.filter((t) => t.dueDate === selectedDate && t.status !== "Completed").length} Remaining
                    </h3>
                  </div>
                </div>

                <div className="frosted-glass rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-md violet-glow">
                    ⏰
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hours Scheduled</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {(
                        tasks
                          .filter((t) => t.dueDate === selectedDate && t.startTime && t.status !== "Completed")
                          .reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60
                      ).toFixed(1)}{" "}
                      Hours
                    </h3>
                  </div>
                </div>

                <div className="frosted-glass rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-md">
                    📅
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Calendar Events</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {
                        gCalEvents.filter((event) => {
                          const startObj = parseIsoDateTime(event.start.dateTime || event.start.date);
                          return startObj && startObj.date === selectedDate;
                        }).length
                      }{" "}
                      Meetings
                    </h3>
                  </div>
                </div>

                <div className="frosted-glass rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-md">
                    ⚠️
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timeline Conflicts</span>
                    <h3 className={`text-lg font-bold mt-0.5 ${conflicts.length > 0 ? "text-rose-400 animate-pulse" : "text-zinc-400"}`}>
                      {conflicts.length} Overlaps
                    </h3>
                  </div>
                </div>
              </div>

              {/* CORE DASHBOARD GRID layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Interactive Daily Time-Blocking timeline */}
                <div className="lg:col-span-7 space-y-4">
                  <DailyTimeline
                    tasks={tasks}
                    gCalEvents={gCalEvents}
                    selectedDate={selectedDate}
                    onSelectTask={(t) => {
                      setSelectedTask(t);
                      setIsEditModalOpen(true);
                    }}
                    conflicts={conflicts}
                  />
                </div>

                {/* Right Column: Unscheduled Tasks / Queue and AI Advisory Advice Card */}
                <div className="lg:col-span-5 space-y-6">
                  {/* High Priority Task Queue Card */}
                  <div className="frosted-glass rounded-2xl p-5 shadow-xl flex flex-col h-[340px]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase">Active Task Queue</h3>
                      </div>

                      {/* Filter tags */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setFilterType("All")}
                          className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition border ${
                            filterType === "All"
                              ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-300 font-bold"
                              : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterType("Local")}
                          className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition border ${
                            filterType === "Local"
                              ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-300 font-bold"
                              : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          Local
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      {tasks.filter((t) => {
                        const dateMatches = t.dueDate === selectedDate;
                        if (filterType === "Local" && t.isGCalSynced) return false;
                        return dateMatches && t.status !== "Completed";
                      }).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10 text-zinc-600 italic text-xs">
                          <p>All clear! No tasks remaining in the queue.</p>
                          <button
                            onClick={() => {
                              setSelectedTask(null);
                              setIsEditModalOpen(true);
                            }}
                            className="mt-3.5 text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/10 text-[11px]"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add a manual task</span>
                          </button>
                        </div>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={tasks
                              .filter((t) => {
                                const dateMatches = t.dueDate === selectedDate;
                                if (filterType === "Local" && t.isGCalSynced) return false;
                                return dateMatches && t.status !== "Completed";
                              })
                              .map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-3">
                              {tasks
                                .filter((t) => {
                                  const dateMatches = t.dueDate === selectedDate;
                                  if (filterType === "Local" && t.isGCalSynced) return false;
                                  return dateMatches && t.status !== "Completed";
                                })
                                .map((task) => (
                                  <SortableTaskCard
                                    key={task.id}
                                    task={task}
                                    onToggleComplete={handleToggleComplete}
                                    onToggleSubtask={handleToggleSubtask}
                                    onDeleteTask={handleDeleteTask}
                                    onPushToGCal={handlePushTaskToGCal}
                                    onSelectTask={(t) => {
                                      setSelectedTask(t);
                                      setIsEditModalOpen(true);
                                    }}
                                    isConflict={conflicts.some((c) => c.taskId === task.id)}
                                  />
                                ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>

                    {/* Batch push helper */}
                    {tasks.some((t) => t.dueDate === selectedDate && !t.isGCalSynced && t.startTime && t.status !== "Completed") && (
                      <button
                        onClick={handleBatchSyncToGCal}
                        className="w-full mt-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[10px] font-bold py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer flex-shrink-0"
                      >
                        <span>Sync Active Schedule to Google Calendar</span>
                      </button>
                    )}
                  </div>

                  {/* AI Assistant advisor panel */}
                  <AIAdvisor
                    tasks={tasks}
                    gCalEvents={gCalEvents}
                    conflicts={conflicts}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendChatAdvice}
                    isGeneratingAdvice={isGeneratingAdvice}
                    onAutoSchedule={handleAutoScheduleDay}
                    isAutoScheduling={isAutoScheduling}
                    className="h-[416px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KANBAN BOARD */}
          {currentTab === "kanban" && (
            <KanbanBoard
              tasks={tasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onSelectTask={(t) => {
                setSelectedTask(t);
                setIsEditModalOpen(true);
              }}
              onOpenCreateModal={() => {
                setSelectedTask(null);
                setIsEditModalOpen(true);
              }}
            />
          )}

          {/* TAB 3: CALENDAR VIEW */}
          {currentTab === "calendar" && (
            <CalendarView
              tasks={tasks}
              gCalEvents={gCalEvents}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onSelectTask={(t) => {
                setSelectedTask(t);
                setIsEditModalOpen(true);
              }}
            />
          )}

          {/* TAB 4: AI PLANNER ASSISTANT SIDE PANEL CHAT (Standalone) */}
          {currentTab === "assistant" && (
            <div className="max-w-4xl mx-auto">
              <AIAdvisor
                tasks={tasks}
                gCalEvents={gCalEvents}
                conflicts={conflicts}
                chatHistory={chatHistory}
                onSendMessage={handleSendChatAdvice}
                isGeneratingAdvice={isGeneratingAdvice}
                onAutoSchedule={handleAutoScheduleDay}
                isAutoScheduling={isAutoScheduling}
              />
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {currentTab === "analytics" && <AnalyticsView tasks={tasks} streak={streak} />}

          {/* TAB 6: SETTINGS */}
          {currentTab === "settings" && (
            <SettingsView
              isGCalConnected={isGCalConnected}
              userGCalEmail={userGCalEmail}
              onConnectGCal={handleConnectGCal}
              onDisconnectGCal={handleDisconnectGCal}
              onResetData={handleResetData}
              workdayStart={workdayStart}
              setWorkdayStart={setWorkdayStart}
              workdayEnd={workdayEnd}
              setWorkdayEnd={setWorkdayEnd}
              defaultTaskDuration={defaultTaskDuration}
              setDefaultTaskDuration={setDefaultTaskDuration}
            />
          )}
        </main>
      </div>

      {/* CREATE / EDIT TASK MODAL POPUP */}
      <TaskEditModal
        task={selectedTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setSelectedTask(null);
          setIsEditModalOpen(false);
        }}
        onSave={handleSaveTask}
        onGenerateAISubtasks={handleGenerateAISubtasks}
      />
        </>
      )}
    </div>
  );
}
