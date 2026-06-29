import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK to prevent crashes on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        console.log("Gemini API Client successfully initialized.");
      } catch (err) {
        console.error("Failed to initialize Gemini Client:", err);
      }
    } else {
      console.warn("GEMINI_API_KEY is not configured or placeholder. Fallback mode active.");
    }
  }
  return aiClient;
}

// Helper to perform generateContent calls with retries on temporary API overloads
async function generateContentWithRetry(client: GoogleGenAI, params: any, retries = 2, delay = 1000): Promise<any> {
  try {
    return await client.models.generateContent(params);
  } catch (err: any) {
    const errMsg = err.message || "";
    const isTemporary = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("429") || errMsg.includes("rate limit") || err.status === 503 || err.status === 429;
    if (isTemporary && retries > 0) {
      console.log(`Gemini API busy (503/429), retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateContentWithRetry(client, params, retries - 1, delay * 1.5);
    }
    throw err;
  }
}

// Ensure server binds to 0.0.0.0 and port 3000
const isProd = process.env.NODE_ENV === "production";

// Fallback logic generators to handle Gemini API unavailability (e.g. 503 Service Unavailable, rate limits)
function getPrioritizeFallback(tasks: any[], currentTime: string | undefined) {
  return (tasks || []).map((t: any) => {
    let priority = t.priority;
    let reasoning = "Prioritized based on local priority selection.";
    if (t.deadline) {
      const diffMs = new Date(t.deadline).getTime() - new Date(currentTime || Date.now()).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours > 0 && diffHours < 24) {
        priority = "high";
        reasoning = `Proactive priority shift: deadline is in ${Math.round(diffHours)} hours!`;
      } else if (diffHours > 0 && diffHours < 72 && t.priority !== "high") {
        priority = "medium";
        reasoning = "Due within 3 days. Recommended action soon.";
      }
    }
    return { id: t.id, priority, aiReasoning: reasoning };
  });
}

function getScheduleFallback(tasks: any[], habits: any[], currentTime: string | undefined) {
  let startHour = 9;
  return (tasks || []).filter((t: any) => !t.completed).map((t: any) => {
    const formattedHour = startHour < 10 ? `0${startHour}` : `${startHour}`;
    const endHourVal = startHour + Math.max(1, Math.ceil((t.estimatedMinutes || 60) / 60));
    const formattedEndHour = endHourVal < 10 ? `0${endHourVal}` : `${endHourVal}`;
    const dateStr = new Date(currentTime || Date.now()).toISOString().split('T')[0];
    const timeBlock = {
      date: dateStr,
      start: `${formattedHour}:00`,
      end: `${formattedEndHour}:00`
    };
    startHour = (endHourVal >= 18) ? 9 : endHourVal; // Wrap or reset
    return { taskId: t.id, timeBlock };
  });
}

function getRecommendFallback(tasks: any[], habits: any[], goals: any[], currentTime: string | undefined) {
  const recs = [];
  
  const highPriority = (tasks || []).filter((t: any) => t.priority === "high" && !t.completed);
  if (highPriority.length > 0) {
    recs.push({
      id: `rec-fb-high-${Date.now()}-1`,
      type: "warning",
      title: "High Priority Alert",
      text: `You have ${highPriority.length} high-priority task(s) active, including "${highPriority[0].title}". Aura recommends shielding this hour for deep focus.`,
      timestamp: new Date().toISOString()
    });
  } else {
    recs.push({
      id: `rec-fb-ok-${Date.now()}-2`,
      type: "tip",
      title: "Flow State Optimized",
      text: "No urgent high-priority bottlenecks detected! This is a perfect window to make progress on medium or creative project backlog items.",
      timestamp: new Date().toISOString()
    });
  }

  const activeHabits = habits || [];
  if (activeHabits.length > 0) {
    const randomHabit = activeHabits[Math.floor(Math.random() * activeHabits.length)];
    recs.push({
      id: `rec-fb-habit-${Date.now()}-3`,
      type: "schedule",
      title: "Habit Integration",
      text: `Have you completed your habit "${randomHabit.title}" today? Keep your streak burning!`,
      timestamp: new Date().toISOString()
    });
  } else {
    recs.push({
      id: `rec-fb-break-${Date.now()}-4`,
      type: "tip",
      title: "Hydration & Energy",
      text: "Based on standard circadian rhythms, we recommend a brief 5-minute glass of water and posture reset to restore cognitive capacity.",
      timestamp: new Date().toISOString()
    });
  }

  const activeGoals = goals || [];
  if (activeGoals.length > 0) {
    const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];
    recs.push({
      id: `rec-fb-goal-${Date.now()}-5`,
      type: "encouragement",
      title: "Eyes on the Prize",
      text: `Keep pushing towards: "${randomGoal.title}". Every small task you complete today is a stepping stone to this milestone!`,
      timestamp: new Date().toISOString()
    });
  }

  return recs;
}

function getDecomposeFallback(taskTitle: string, taskDescription: string, category: string) {
  const steps = [
    `Research & define requirements for "${taskTitle}"`,
    `Outline key milestones and resources needed`,
    `Execute core implementation phases`,
    `Review, test, and polish the final deliverables`
  ];
  return steps.map((title, idx) => ({
    id: `sub-fb-${idx}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    completed: false,
    aiGenerated: true,
    executionOutput: null
  }));
}

function getExecuteFallback(taskTitle: string, taskDescription: string, subtaskTitle: string) {
  return `### [AURA DRAFT PROPOSAL]
Here is a structured draft layout generated for **"${subtaskTitle}"** as part of the objective **"${taskTitle}"**:

#### 1. Objective & Scope
- **Sub-target**: ${subtaskTitle}
- **Context**: ${taskDescription || "Establish initial framework and clear benchmarks."}

#### 2. Action Plan & Key Pillars
*   **Draft Framework**: Identify the top three variables impacting this milestone.
*   **Information Gathering**: Retrieve prerequisite documents or technical specifications.
*   **Initial Prototype/Drafting**: Build a low-fidelity draft focusing on core logic or messaging.

#### 3. Recommended Guidelines
*   Keep the approach modular and check for early feedback loops.
*   Reserve 25 minutes of quiet time to finish this without context switching.`;
}

function getChatFallback(messages: any[], tasks: any[], habits: any[], goals: any[]) {
  const lastMsg = messages[messages.length - 1]?.content || "";
  const lastMsgLower = lastMsg.toLowerCase();
  
  let reply = "";
  if (lastMsgLower.includes("hello") || lastMsgLower.includes("hi ") || lastMsgLower.includes("hey")) {
    reply = "Hello! I'm Aura, your productivity companion. How is your focus today? I can help you prioritize, schedule, or decompose tasks.";
  } else if (lastMsgLower.includes("prioritize") || lastMsgLower.includes("rank")) {
    reply = "I suggest using the 'AI Prioritize & Align' button in your Task list to dynamically sort your tasks. Or, let's start by identifying your absolute most urgent task for today.";
  } else if (lastMsgLower.includes("schedule") || lastMsgLower.includes("plan")) {
    reply = "You can activate 'AI Adaptive Time-Block' on the Calendar tab to block out specific, non-overlapping hours for your tasks.";
  } else if (lastMsgLower.includes("habit") || lastMsgLower.includes("streak")) {
    reply = "Building habits is about daily repetition. Keep your streak active! Which habit are you focusing on completing right now?";
  } else if (tasks && tasks.length > 0) {
    const pending = tasks.filter((t: any) => !t.completed);
    if (pending.length > 0) {
      reply = `Regarding your message: "${lastMsg}". To help you make progress, I recommend starting with your task: "${pending[0].title}". Would you like me to draft an execution plan for it?`;
    } else {
      reply = `Regarding your query: "${lastMsg}". You have cleared your entire task list! That is an incredible milestone. Why not use this time for a healthy habit or take a well-deserved break?`;
    }
  } else {
    reply = `I appreciate you sharing that. As your executive coach, I encourage you to stay structured. What is the single highest-leverage thing you can work on next?`;
  }
  return reply;
}

// API Endpoint: Prioritize Tasks
app.post("/api/ai/prioritize", async (req, res) => {
  const { tasks, currentTime } = req.body;
  const client = getGeminiClient();

  if (!client) {
    console.log("Using fallback prioritization (no client)...");
    const updatedTasks = getPrioritizeFallback(tasks, currentTime);
    return res.json({ tasks: updatedTasks });
  }

  try {
    const prompt = `You are a high-performance cognitive productivity companion.
Analyze the following list of tasks and the current user's local time: ${currentTime}.
Determine the optimized priority level ('low', 'medium', 'high') for each task to prevent bottlenecks, ensure deadlines are met, and group similar categories. Provide a direct, reassuring reason (aiReasoning) for your decision.

Tasks:
${JSON.stringify(tasks, null, 2)}

Return ONLY a JSON object of this structure:
{
  "tasks": [
    {
      "id": "task-id",
      "priority": "low" | "medium" | "high",
      "aiReasoning": "Clear explanation of why this was prioritized and how to tackle it."
    }
  ]
}`;

    const response = await generateContentWithRetry(client, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (err: any) {
    console.warn("Gemini prioritize error, executing fallback:", err.message || err);
    const updatedTasks = getPrioritizeFallback(tasks, currentTime);
    res.json({ tasks: updatedTasks });
  }
});

// API Endpoint: Schedule Assistance
app.post("/api/ai/schedule", async (req, res) => {
  const { tasks, habits, currentTime } = req.body;
  const client = getGeminiClient();

  if (!client) {
    console.log("Using fallback scheduler (no client)...");
    const schedules = getScheduleFallback(tasks, habits, currentTime);
    return res.json({ schedules });
  }

  try {
    const prompt = `You are an AI Scheduling Assistant. Assign reasonable timeblocks for today or tomorrow for each uncompleted task, matching their estimated durations, while respecting standard productive working hours (9:00 AM to 6:00 PM). Ensure high-priority tasks are scheduled earlier, and avoid overlapping slots.
Current time: ${currentTime}

Tasks:
${JSON.stringify((tasks || []).filter((t: any) => !t.completed), null, 2)}

Habits to keep in mind:
${JSON.stringify(habits || [], null, 2)}

Return ONLY a JSON object of this structure:
{
  "schedules": [
    {
      "taskId": "task-id",
      "timeBlock": {
        "date": "YYYY-MM-DD",
        "start": "HH:MM",
        "end": "HH:MM"
      }
    }
  ]
}`;

    const response = await generateContentWithRetry(client, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (err: any) {
    console.warn("Gemini schedule error, executing fallback:", err.message || err);
    const schedules = getScheduleFallback(tasks, habits, currentTime);
    res.json({ schedules });
  }
});

// API Endpoint: Proactive recommendations & Context-aware reminders
app.post("/api/ai/recommend", async (req, res) => {
  const { tasks, habits, goals, currentTime } = req.body;
  const client = getGeminiClient();

  if (!client) {
    console.log("Using fallback recommendation (no client)...");
    const recs = getRecommendFallback(tasks, habits, goals, currentTime);
    return res.json({ recommendations: recs });
  }

  try {
    const prompt = `You are a proactive, empathetic personal coach. Analyze the user's workload, goals, habits, and deadlines. Generate 2 to 4 personalized, highly specific, context-aware productivity recommendations, warnings, schedules, or words of encouragement.
Current time: ${currentTime}

Workload (Tasks):
${JSON.stringify(tasks, null, 2)}

Habits:
${JSON.stringify(habits, null, 2)}

Goals:
${JSON.stringify(goals, null, 2)}

Return ONLY a JSON object of this structure:
{
  "recommendations": [
    {
      "id": "unique-id-1",
      "type": "warning" | "tip" | "schedule" | "encouragement",
      "title": "Short title",
      "text": "Specific actionable coaching recommendation referring directly to their actual tasks or habits"
    }
  ]
}`;

    const response = await generateContentWithRetry(client, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    const recommendations = (data.recommendations || []).map((r: any, idx: number) => ({
      ...r,
      id: r.id || `rec-ai-${idx}-${Date.now()}`,
      timestamp: new Date().toISOString()
    }));
    res.json({ recommendations });
  } catch (err: any) {
    console.warn("Gemini recommend error, executing fallback:", err.message || err);
    const recs = getRecommendFallback(tasks, habits, goals, currentTime);
    res.json({ recommendations: recs });
  }
});

// API Endpoint: Decompose large task into subtasks (Autonomous Planning)
app.post("/api/ai/decompose", async (req, res) => {
  const { taskTitle, taskDescription, category } = req.body;
  const client = getGeminiClient();

  if (!client) {
    console.log("Using fallback decomposition (no client)...");
    const subtasks = getDecomposeFallback(taskTitle, taskDescription, category);
    return res.json({ subtasks });
  }

  try {
    const prompt = `You are an Autonomous Task Planner. Decompose the following complex task into 3 to 6 logical, actionable, chronological subtasks.

Task Title: ${taskTitle}
Description: ${taskDescription}
Category: ${category}

Return ONLY a JSON object of this structure:
{
  "subtasks": [
    {
      "title": "Clear, concise, highly specific subtask action"
    }
  ]
}`;

    const response = await generateContentWithRetry(client, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    const subtasks = (data.subtasks || []).map((st: any) => ({
      id: `sub-ai-${Math.random().toString(36).substr(2, 9)}`,
      title: st.title,
      completed: false,
      aiGenerated: true,
      executionOutput: null
    }));
    res.json({ subtasks });
  } catch (err: any) {
    console.warn("Gemini decompose error, executing fallback:", err.message || err);
    const subtasks = getDecomposeFallback(taskTitle, taskDescription, category);
    res.json({ subtasks });
  }
});

// API Endpoint: Autonomous Execution (simulating outline/content generation)
app.post("/api/ai/execute", async (req, res) => {
  const { taskTitle, taskDescription, subtaskTitle } = req.body;
  const client = getGeminiClient();

  if (!client) {
    console.log("Using fallback execution (no client)...");
    const fallbackOutput = getExecuteFallback(taskTitle, taskDescription, subtaskTitle);
    return res.json({ executionOutput: fallbackOutput });
  }

  try {
    const prompt = `You are an autonomous productivity assistant capable of "executing" task steps by drafting actual workspace content.
The user needs assistance completing the subtask: "${subtaskTitle}"
Which belongs to the main task: "${taskTitle}" (${taskDescription || "No description provided"})

Write a highly detailed, professional, and directly usable draft content, templates, structured lists, markdown outline, code boilerplate, or email draft (whichever is most appropriate for the task theme). Be incredibly useful, complete, and comprehensive.

Output your response as rich markdown content.

Return ONLY a JSON object with this exact structure:
{
  "executionOutput": "YOUR_GENERATED_MARKDOWN_HERE"
}`;

    const response = await generateContentWithRetry(client, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (err: any) {
    console.warn("Gemini execute error, executing fallback:", err.message || err);
    const fallbackOutput = getExecuteFallback(taskTitle, taskDescription, subtaskTitle);
    res.json({ executionOutput: fallbackOutput });
  }
});

// API Endpoint: Coach Chat (Conversational, supports voice interaction inputs)
app.post("/api/ai/chat", async (req, res) => {
  const { messages, tasks, habits, goals, currentTime } = req.body;
  const client = getGeminiClient();

  if (!client) {
    console.log("Using fallback chat (no client)...");
    const reply = getChatFallback(messages, tasks, habits, goals);
    return res.json({ reply });
  }

  try {
    const systemInstruction = `You are "Aura", an incredibly supportive, sharp, and proactive AI Productivity Companion and vocal executive coach.
Your job is to keep the user focused, motivated, and highly organized. 
You know the user's current tasks, habits, goals, and local time. Use this context naturally to offer real-time help, answer questions, provide direct encouragement, or help reorganize items.
If the user asks you to prioritize, schedule, or decompose tasks, invite them to use the interactive dashboard controls or tell them you can suggest direct actions here.
Keep your answers conversational, concise, motivating, and professional. Avoid long text dumps.

Current user local time: ${currentTime}
Active Tasks: ${JSON.stringify(tasks || [], null, 2)}
Habits: ${JSON.stringify(habits || [], null, 2)}
Goals: ${JSON.stringify(goals || [], null, 2)}
`;

    const geminiContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const contents = [
      {
        role: "user",
        parts: [{ text: `[System Instructions]: ${systemInstruction}` }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am Aura, your productivity companion, fully synchronized with your current tasks, habits, and goals. I am ready to guide and support you." }]
      },
      ...geminiContents
    ];

    const response = await generateContentWithRetry(client, {
      model: "gemini-3.5-flash",
      contents: contents,
    });

    res.json({ reply: response.text || "No response received from Aura." });
  } catch (err: any) {
    console.warn("Gemini chat error, executing fallback:", err.message || err);
    const reply = getChatFallback(messages, tasks, habits, goals);
    res.json({ reply });
  }
});

// Express Vite Middleware setup
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
