import { useState, useEffect } from "react";
import { 
  Sparkles, Clock, Target, Flame, CheckCircle2, Award, Bot, AlertTriangle, ListTodo, Calendar, MessageSquare, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Task, Goal, Habit, ProductivityRecommendation, ChatMessage } from "./types";
import TaskPlanner from "./components/TaskPlanner";
import CalendarScheduler from "./components/CalendarScheduler";
import HabitGoalTracker from "./components/HabitGoalTracker";
import AuraVoiceCoach from "./components/AuraVoiceCoach";
import Recommendations from "./components/Recommendations";

const SEEDED_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Draft quarterly growth outline",
    description: "Structure key milestones, assess channel budgets, and establish OKRs.",
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    priority: "high",
    category: "Work",
    estimatedMinutes: 90,
    completed: false,
    subtasks: [],
    timeBlock: null,
    createdTime: new Date().toISOString()
  },
  {
    id: "task-2",
    title: "Refine product portfolio website",
    description: "Improve visual hierarchy, upgrade fonts, and optimize mobile responsive menus.",
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    priority: "medium",
    category: "Personal",
    estimatedMinutes: 60,
    completed: false,
    subtasks: [],
    timeBlock: null,
    createdTime: new Date().toISOString()
  }
];

const SEEDED_GOALS: Goal[] = [
  {
    id: "goal-1",
    title: "Launch Portfolio v2.0",
    description: "Build clean, professional design layouts and integrate interactive models.",
    targetDate: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
    completed: false,
    progress: 45,
    tasksAssigned: ["task-2"]
  }
];

const SEEDED_HABITS: Habit[] = [
  {
    id: "habit-1",
    title: "30m focused deep work block",
    frequency: "daily",
    streak: 6,
    lastCompleted: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    history: {}
  },
  {
    id: "habit-2",
    title: "Drink 3 liters of water",
    frequency: "daily",
    streak: 3,
    lastCompleted: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    history: {}
  }
];

const SEEDED_CHAT: ChatMessage[] = [
  {
    id: "chat-welcome",
    role: "assistant",
    content: "Greetings! I am Aura, your AI productivity companion. I've analyzed your active task queue, strategic milestones, and daily habits. Let's make today exceptionally structured and focused! Speak or type to start planning.",
    timestamp: new Date().toISOString()
  }
];

export default function App() {
  // Tabs: 'workspace' | 'calendar' | 'habits' | 'coach'
  const [activeTab, setActiveTab] = useState<"workspace" | "calendar" | "habits" | "coach">("workspace");

  // Client-persistent state
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("companion_tasks");
    return saved ? JSON.parse(saved) : SEEDED_TASKS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("companion_goals");
    return saved ? JSON.parse(saved) : SEEDED_GOALS;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("companion_habits");
    return saved ? JSON.parse(saved) : SEEDED_HABITS;
  });

  const [recommendations, setRecommendations] = useState<ProductivityRecommendation[]>(() => {
    const saved = localStorage.getItem("companion_recommendations");
    return saved ? JSON.parse(saved) : [];
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("companion_chat");
    return saved ? JSON.parse(saved) : SEEDED_CHAT;
  });

  // Loading Flags
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isDecomposingId, setIsDecomposingId] = useState<string | null>(null);
  const [isExecutingId, setIsExecutingId] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("companion_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("companion_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("companion_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("companion_recommendations", JSON.stringify(recommendations));
  }, [recommendations]);

  useEffect(() => {
    localStorage.setItem("companion_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Generate recommendation on initial mount if empty
  useEffect(() => {
    if (recommendations.length === 0) {
      handleTriggerRecommendations();
    }
  }, []);

  // Productivity Score calculation
  const calculateProductivityScore = () => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskRatio = tasks.length > 0 ? (completedTasks / tasks.length) * 40 : 20;

    const habitCompletionsToday = habits.filter(h => {
      const todayStr = new Date().toISOString().split("T")[0];
      return h.history[todayStr] === true || h.lastCompleted === todayStr;
    }).length;
    const habitRatio = habits.length > 0 ? (habitCompletionsToday / habits.length) * 35 : 15;

    const averageGoalProgress = goals.length > 0 
      ? goals.reduce((acc, g) => acc + g.progress, 0) / goals.length 
      : 50;
    const goalRatio = (averageGoalProgress / 100) * 25;

    return Math.round(taskRatio + habitRatio + goalRatio);
  };

  const productivityScore = calculateProductivityScore();

  // Urgent reminder warning
  const getProactiveAlert = () => {
    const activeTasks = tasks.filter(t => !t.completed);
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Find if any active task is due today or tomorrow
    const urgentTask = activeTasks.find(t => {
      const deadline = new Date(t.deadline);
      const today = new Date(todayStr);
      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 1;
    });

    if (urgentTask) {
      return `Proactive Coach Alert: "${urgentTask.title}" has an upcoming deadline! Use Aura's Adaptive Time-Block to schedule focus time now.`;
    }
    return "Your workload looks balanced. Establish regular habit routines to unlock further cognitive consistency!";
  };

  // --- API Integrations ---

  // 1. AI Prioritization
  const handleTriggerPrioritization = async () => {
    setIsPrioritizing(true);
    try {
      const response = await fetch("/api/ai/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          currentTime: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (data.tasks) {
        const updated = tasks.map(t => {
          const matchingAI = data.tasks.find((aiTask: any) => aiTask.id === t.id);
          if (matchingAI) {
            return {
              ...t,
              priority: matchingAI.priority,
              aiReasoning: matchingAI.aiReasoning
            };
          }
          return t;
        });
        setTasks(updated);
      }
    } catch (err) {
      console.error("Prioritization error:", err);
    } finally {
      setIsPrioritizing(false);
    }
  };

  // 2. AI Scheduling
  const handleTriggerScheduling = async () => {
    setIsScheduling(true);
    try {
      const response = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          habits,
          currentTime: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (data.schedules) {
        const updated = tasks.map(t => {
          const matchingSchedule = data.schedules.find((s: any) => s.taskId === t.id);
          if (matchingSchedule) {
            return {
              ...t,
              timeBlock: matchingSchedule.timeBlock
            };
          }
          return t;
        });
        setTasks(updated);
      }
    } catch (err) {
      console.error("Scheduling error:", err);
    } finally {
      setIsScheduling(false);
    }
  };

  // 3. AI Recommendations
  const handleTriggerRecommendations = async () => {
    setIsRecommending(true);
    try {
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          habits,
          goals,
          currentTime: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error("Recommendations error:", err);
    } finally {
      setIsRecommending(false);
    }
  };

  // 4. AI Subtasks Decomposition
  const handleDecomposeTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setIsDecomposingId(taskId);
    try {
      const response = await fetch("/api/ai/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description,
          category: task.category
        })
      });
      const data = await response.json();
      if (data.subtasks) {
        const updated = tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, subtasks: data.subtasks };
          }
          return t;
        });
        setTasks(updated);
      }
    } catch (err) {
      console.error("Decomposition error:", err);
    } finally {
      setIsDecomposingId(null);
    }
  };

  // 5. AI Subtask Execution (Simulating template code/draft generation)
  const handleExecuteSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks.find(st => st.id === subtaskId);
    if (!task || !subtask) return;

    setIsExecutingId(subtaskId);
    try {
      const response = await fetch("/api/ai/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description,
          subtaskTitle: subtask.title
        })
      });
      const data = await response.json();
      if (data.executionOutput) {
        const updated = tasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              subtasks: t.subtasks.map(st => 
                st.id === subtaskId ? { ...st, executionOutput: data.executionOutput } : st
              )
            };
          }
          return t;
        });
        setTasks(updated);
      }
    } catch (err) {
      console.error("Execution draft error:", err);
    } finally {
      setIsExecutingId(null);
    }
  };

  // 6. Vocal Coach Chat
  const handleSendChatMessage = async (text: string) => {
    const newUserMsg: ChatMessage = {
      id: `chat-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          tasks,
          habits,
          goals,
          currentTime: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (data.reply) {
        const newCompanionMsg: ChatMessage = {
          id: `chat-aura-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, newCompanionMsg]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Task Actions
  const handleAddTask = (newTaskData: Omit<Task, "id" | "createdTime" | "completed" | "subtasks" | "timeBlock">) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      completed: false,
      subtasks: [],
      timeBlock: null,
      createdTime: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Goal Actions
  const handleAddGoal = (newGoalData: Omit<Goal, "id" | "progress" | "completed" | "tasksAssigned">) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: `goal-${Date.now()}`,
      completed: false,
      progress: 0,
      tasksAssigned: []
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const handleUpdateGoalProgress = (id: string, progress: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress, completed: progress === 100 } : g));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Habit Actions
  const handleAddHabit = (newHabitData: Omit<Habit, "id" | "streak" | "lastCompleted" | "history">) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: `habit-${Date.now()}`,
      streak: 0,
      lastCompleted: null,
      history: {}
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleToggleHabit = (id: string, dateStr: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const completed = h.history[dateStr] || false;
        const nextHistory = { ...h.history, [dateStr]: !completed };
        
        let nextStreak = h.streak;
        let nextLastCompleted = h.lastCompleted;

        if (!completed) {
          // Completed the habit
          nextStreak += 1;
          nextLastCompleted = dateStr;
        } else {
          // Unchecked the habit
          nextStreak = Math.max(0, nextStreak - 1);
          // Recalculate previous lastCompleted
          const historyDates = Object.keys(nextHistory).filter(d => nextHistory[d]);
          nextLastCompleted = historyDates.length > 0 ? historyDates[historyDates.length - 1] : null;
        }

        return {
          ...h,
          history: nextHistory,
          streak: nextStreak,
          lastCompleted: nextLastCompleted
        };
      }
      return h;
    }));
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col font-sans">
      
      {/* Dynamic Proactive Alert Banner */}
      <div className="bg-gradient-to-r from-[#0D0D0D] via-[#1A102F] to-[#0D0D0D] border-b border-zinc-800 px-4 py-2 text-center text-zinc-300 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm shrink-0">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400 shrink-0" />
        <span className="truncate">{getProactiveAlert()}</span>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Header Dashboard section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0D0D0D] border border-zinc-800/80 p-5 rounded-3xl shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl font-black text-zinc-100 tracking-tight">AI Productivity Companion</h1>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Your Cognitive Execution & Planning Space</p>
              </div>
            </div>
          </div>

          {/* Productivity Score Indicator */}
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800/80 py-2.5 px-4 rounded-2xl w-full md:w-auto justify-between md:justify-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Workspace Health</span>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">Productivity Velocity</p>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1 shadow-xs">
              <Award className="w-4 h-4 text-indigo-400 animate-bounce" />
              <span className="text-lg font-black font-mono text-indigo-400">{productivityScore}%</span>
            </div>
          </div>
        </div>

        {/* Dynamic Recommendations Insight Row */}
        <Recommendations
          recommendations={recommendations}
          onRefresh={handleTriggerRecommendations}
          isLoading={isRecommending}
        />

        {/* Tab Navigation Controls */}
        <div className="flex bg-zinc-900 border border-zinc-800/80 p-1.5 rounded-2xl w-full max-w-lg">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "workspace" 
                ? "bg-zinc-850 border border-zinc-800 text-zinc-100 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Planning
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "calendar" 
                ? "bg-zinc-850 border border-zinc-800 text-zinc-100 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setActiveTab("habits")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "habits" 
                ? "bg-zinc-850 border border-zinc-800 text-zinc-100 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            }`}
          >
            <Target className="w-4 h-4" />
            Goals & Habits
          </button>
          <button
            onClick={() => setActiveTab("coach")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "coach" 
                ? "bg-zinc-850 border border-zinc-800 text-zinc-100 shadow-sm" 
                : "text-slate-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Aura Coach
          </button>
        </div>

        {/* Dynamic Panels */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === "workspace" && (
                <TaskPlanner
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onUpdateTasks={setTasks}
                  onDeleteTask={handleDeleteTask}
                  onTriggerPrioritization={handleTriggerPrioritization}
                  onDecomposeTask={handleDecomposeTask}
                  onExecuteSubtask={handleExecuteSubtask}
                  isPrioritizing={isPrioritizing}
                  isDecomposingId={isDecomposingId}
                  isExecutingId={isExecutingId}
                />
              )}

              {activeTab === "calendar" && (
                <CalendarScheduler
                  tasks={tasks}
                  onTriggerScheduling={handleTriggerScheduling}
                  isScheduling={isScheduling}
                />
              )}

              {activeTab === "habits" && (
                <HabitGoalTracker
                  goals={goals}
                  habits={habits}
                  onAddGoal={handleAddGoal}
                  onAddHabit={handleAddHabit}
                  onToggleHabit={handleToggleHabit}
                  onUpdateGoalProgress={handleUpdateGoalProgress}
                  onDeleteGoal={handleDeleteGoal}
                  onDeleteHabit={handleDeleteHabit}
                />
              )}

              {activeTab === "coach" && (
                <AuraVoiceCoach
                  chatHistory={chatHistory}
                  onSendMessage={handleSendChatMessage}
                  isChatLoading={isChatLoading}
                  tasksCount={tasks.filter(t => !t.completed).length}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
