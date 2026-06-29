import { useState, FormEvent } from "react";
import { Target, Flame, TrendingUp, CheckCircle, Plus, Trash2, Calendar, Award } from "lucide-react";
import { Goal, Habit } from "../types";

interface HabitGoalTrackerProps {
  goals: Goal[];
  habits: Habit[];
  onAddGoal: (goal: Omit<Goal, "id" | "progress" | "completed" | "tasksAssigned">) => void;
  onAddHabit: (habit: Omit<Habit, "id" | "streak" | "lastCompleted" | "history">) => void;
  onToggleHabit: (id: string, dateStr: string) => void;
  onUpdateGoalProgress: (id: string, progress: number) => void;
  onDeleteGoal: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export default function HabitGoalTracker({
  goals,
  habits,
  onAddGoal,
  onAddHabit,
  onToggleHabit,
  onUpdateGoalProgress,
  onDeleteGoal,
  onDeleteHabit
}: HabitGoalTrackerProps) {
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const [habitTitle, setHabitTitle] = useState("");
  const [habitFreq, setHabitFreq] = useState<"daily" | "weekly">("daily");

  const todayStr = new Date().toISOString().split("T")[0];

  const handleGoalSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    onAddGoal({
      title: goalTitle,
      description: goalDesc,
      targetDate: goalDate || new Date().toISOString().split("T")[0]
    });
    setGoalTitle("");
    setGoalDesc("");
    setGoalDate("");
  };

  const handleHabitSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    onAddHabit({
      title: habitTitle,
      frequency: habitFreq
    });
    setHabitTitle("");
  };

  return (
    <div id="habit-goal-tracker-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 🚀 Goal Section */}
      <div className="space-y-6">
        {/* Create Goal Card */}
        <div className="bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Establish Strategic Goal</h2>
          </div>

          <form onSubmit={handleGoalSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Goal Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Master React Native development"
                value={goalTitle}
                onChange={e => setGoalTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 focus:border-zinc-750"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Impact Description</label>
              <input
                type="text"
                placeholder="Why does this goal matter? What defines success?"
                value={goalDesc}
                onChange={e => setGoalDesc(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 focus:border-zinc-750"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Target Date</label>
              <input
                type="date"
                value={goalDate}
                onChange={e => setGoalDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-900/60 text-zinc-100 focus:border-zinc-750"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Save Goal
            </button>
          </form>
        </div>

        {/* Goals List */}
        <div className="bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-300">Strategic Goals ({goals.length})</h3>

          {goals.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No active goals mapped out yet. Establish your first milestone above!
            </div>
          ) : (
            <div className="space-y-3.5">
              {goals.map((g) => (
                <div key={g.id} className="p-4 border border-zinc-850 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-all space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{g.title}</h4>
                      {g.description && <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{g.description}</p>}
                      <span className="text-[10px] text-zinc-500 font-mono block mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Target: {g.targetDate}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-rose-455 transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Goal Progress Slider & Tracker */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                      <span className="font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-indigo-400" /> Progress
                      </span>
                      <span className="font-mono font-bold text-indigo-400">{g.progress}%</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={g.progress}
                        onChange={e => onUpdateGoalProgress(g.id, Number(e.target.value))}
                        className="flex-1 accent-indigo-500 h-1 rounded-lg cursor-pointer bg-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🔥 Habit Section */}
      <div className="space-y-6">
        {/* Create Habit Card */}
        <div className="bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Flame className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Establish Healthy Habit</h2>
          </div>

          <form onSubmit={handleHabitSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Habit Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Read 15 pages of non-fiction, Drink 3L water"
                value={habitTitle}
                onChange={e => setHabitTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 focus:border-zinc-750"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Frequency</label>
              <select
                value={habitFreq}
                onChange={e => setHabitFreq(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm border border-zinc-800 rounded-xl bg-zinc-900/60 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 [&_option]:bg-zinc-950 [&_option]:text-zinc-100"
              >
                <option value="daily">Daily Habit</option>
                <option value="weekly">Weekly Habit</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Save Habit
            </button>
          </form>
        </div>

        {/* Habits List */}
        <div className="bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-300">Healthy Habits ({habits.length})</h3>

          {habits.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No habits declared. Build your streak starting today!
            </div>
          ) : (
            <div className="space-y-3.5">
              {habits.map((h) => {
                const completedToday = h.history[todayStr] || false;
                return (
                  <div key={h.id} className="p-3.5 border border-zinc-850 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleHabit(h.id, todayStr)}
                        className={`p-1 rounded-xl transition-all cursor-pointer ${
                          completedToday 
                            ? "bg-indigo-500/15 text-indigo-400 border-2 border-indigo-500/25" 
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-500 border-2 border-zinc-750"
                        }`}
                      >
                        <CheckCircle className={`w-5 h-5 ${completedToday ? "fill-indigo-500/20 text-indigo-400" : "text-zinc-600"}`} />
                      </button>

                      <div>
                        <h4 className="text-xs font-bold text-zinc-200 leading-tight">{h.title}</h4>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">{h.frequency}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold font-mono">
                        <Flame className="w-4 h-4 fill-amber-500/25 stroke-amber-500 animate-pulse" /> {h.streak} streak
                      </div>
                      <button
                        onClick={() => onDeleteHabit(h.id)}
                        className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-rose-455 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
