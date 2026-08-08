import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get Gemini API Client safely
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured or holds a placeholder value. Please set your Gemini API key in the Secrets/Environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

// 1. Natural Language Task Parser Endpoint
app.post("/api/parse-task", async (req, res) => {
  try {
    const { prompt, clientTime } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are a precise task scheduling assistant. Your job is to parse a natural language input description of a task and output a structured JSON object matching the Task model.
Today's local date and time is: ${clientTime || new Date().toISOString()}.
Use this reference to resolve dates like "today", "tomorrow", "next Monday", "next Friday", etc.

Structure of the output Task JSON:
{
  "title": "Task Title",
  "description": "Short description of what to do (can include parsed info or remain simple)",
  "dueDate": "YYYY-MM-DD",
  "estimatedMinutes": 60, (integer, default to 30 or 60 if not specified),
  "priority": "Low" | "Medium" | "High" | "Urgent" (default to "Medium"),
  "category": "Work" | "Personal" | "Health" | "Deep Work" (default to "Work" or infer from content),
  "startTime": "HH:MM", (optional, format e.g. "14:00" or "09:30". Infer if specific time is mentioned like "at 10am" or "6pm"),
  "subtasks": [] (optional array of { "title": string, "completed": false } if any nested steps are mentioned or implied, e.g. "remember to buy eggs and milk" -> subtasks for "buy eggs", "buy milk")
}

Return ONLY a raw JSON object. Do not include markdown code block characters (\`\`\`json ... \`\`\`) or extra formatting text. Just the pure valid JSON string.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { role: "user", parts: [{ text: `Parse this: "${prompt}"` }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    const text = response.text?.trim() || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error parsing task:", error);
    res.status(500).json({ error: error.message || "Failed to parse task" });
  }
});

// 2. One-Click AI Subtask Generator Endpoint
app.post("/api/generate-subtasks", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are an expert productivity coach. Given a task title and brief description, break it down into 3-5 clear, actionable sub-steps (subtasks).
Output a JSON array of subtasks, where each item has the format:
{ "title": "Subtask title description" }

Return ONLY the raw JSON array. Do not wrap in markdown or backticks. Example:
[
  { "title": "First actionable step" },
  { "title": "Second actionable step" }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { role: "user", parts: [{ text: `Task: "${title}"\nDescription: "${description || ""}"` }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    const text = response.text?.trim() || "[]";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error generating subtasks:", error);
    res.status(500).json({ error: error.message || "Failed to generate subtasks" });
  }
});

// 3. GCal-Aware AI Auto-Scheduler
app.post("/api/auto-schedule", async (req, res) => {
  try {
    const { tasks, gCalEvents, clientTime } = req.body;
    const ai = getGeminiClient();

    const systemPrompt = `You are an elite AI Time-Blocking Scheduler. Your objective is to arrange uncompleted local tasks into free slots between 6:00 AM (06:00) and 10:00 PM (22:00) without overlapping with each other OR with Google Calendar events.

Rules:
1. Google Calendar events are LOCKED (fixed) and CANNOT be moved or changed. You must find open time slots around them.
2. Only schedule/update tasks that are NOT completed.
3. For each task scheduled, allocate "startTime" (format "HH:MM") and "endTime" (format "HH:MM") on the schedule.
4. Estimate task duration based on "estimatedMinutes" (calculate endTime = startTime + estimatedMinutes).
5. Prioritize tasks with higher priority ("Urgent" > "High" > "Medium" > "Low").
6. Avoid double-booking or overlaps.
7. Return an updated JSON list of all the tasks you scheduled/rescheduled, along with a brief explanation/coaching advice under a key called "advice".

Input parameters details:
- Tasks to schedule: ${JSON.stringify(tasks)}
- Google Calendar Events (locked): ${JSON.stringify(gCalEvents)}
- Today's date reference: ${clientTime}

Expected output format:
{
  "tasks": [ ...list of all input tasks, with updated "startTime" and "endTime" for those you scheduled... ],
  "advice": "A brief, encouraging explanation of how the schedule was optimized around your external calendar sync events."
}

Ensure you output ONLY the valid JSON, no markdown formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { role: "user", parts: [{ text: "Please optimize my schedule." }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    const text = response.text?.trim() || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in auto-scheduling:", error);
    res.status(500).json({ error: error.message || "Failed to auto-schedule tasks" });
  }
});

// 4. Workload Advice Chat Assistant Endpoint
app.post("/api/workload-advice", async (req, res) => {
  try {
    const { tasks, gCalEvents, chatHistory, message, clientTime } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are an expert Productivity Assistant and Workload Coach integrated into a modern AI-Powered Scheduler.
You have access to the user's current tasks and Google Calendar events.
Today is: ${clientTime}.

Current Local Tasks:
${JSON.stringify(tasks, null, 2)}

Synced Google Calendar Events:
${JSON.stringify(gCalEvents, null, 2)}

Analyze the user's question, offer practical, concise time-management advice, detect scheduling conflicts, and suggest deep-work blocks or breaks. Be supportive and brief (1-3 sentences or clear bullet points).`;

    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: systemPrompt
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Error in workload advice:", error);
    res.status(500).json({ error: error.message || "Failed to generate workload advice" });
  }
});

// Vite Middleware & Static Server configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
