import { useState } from "react";
import { Calendar as CalendarIcon, Clock, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Task } from "../types";

interface CalendarSchedulerProps {
  tasks: Task[];
  onTriggerScheduling: () => void;
  isScheduling: boolean;
}

export default function CalendarScheduler({
  tasks,
  onTriggerScheduling,
  isScheduling
}: CalendarSchedulerProps) {
  // We'll show a daily timeline grid for "Today" and "Tomorrow"
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 9:00 AM to 6:00 PM (18:00)

  const activeTasks = tasks.filter(t => !t.completed);
  const scheduledTasksForDate = tasks.filter(t => t.timeBlock && t.timeBlock.date === selectedDate);
  const unscheduledTasks = activeTasks.filter(t => !t.timeBlock);

  // Map task categories to soft border & background accents
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "Work": return "bg-indigo-500/10 border-indigo-500/20 text-indigo-200 border-l-indigo-500";
      case "Personal": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-200 border-l-emerald-500";
      case "Health": return "bg-teal-500/10 border-teal-500/20 text-teal-200 border-l-teal-500";
      case "Study": return "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-200 border-l-fuchsia-500";
      default: return "bg-zinc-800/80 border-zinc-750 text-zinc-300 border-l-zinc-500";
    }
  };

  return (
    <div id="calendar-scheduler-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Schedule Info / AI Auto-Plan Side panel */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Adaptive Planner</h2>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed mb-4">
            Aura aligns your tasks within standard working slots (09:00 AM - 06:00 PM) based on deadlines and duration estimates, avoiding overlapping conflicts.
          </p>

          <button
            onClick={onTriggerScheduling}
            disabled={isScheduling || activeTasks.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isScheduling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Adaptive Time-Block
          </button>
        </div>

        {/* Unscheduled Tasks Queue */}
        <div className="bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-300 mb-3">Unscheduled Items ({unscheduledTasks.length})</h3>
          {unscheduledTasks.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-xs">
              All active tasks have been successfully scheduled on your calendar!
            </div>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {unscheduledTasks.map(t => (
                <div key={t.id} className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-300 truncate">{t.title}</p>
                    <span className="text-[10px] text-zinc-500 block">Duration: {t.estimatedMinutes}m • {t.category}</span>
                  </div>
                  <span className="shrink-0 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5" /> Backlog
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Calendar View Grid */}
      <div className="lg:col-span-8 bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm">
        {/* Date Selector Buttons */}
        <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-zinc-800 text-zinc-455 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === tomorrowStr 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-zinc-800 text-zinc-455 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              Tomorrow
            </button>
          </div>
          <span className="text-xs font-semibold font-mono text-zinc-500">
            Selected: {new Date(selectedDate).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Daily timeline grid */}
        <div className="space-y-1 relative">
          {hours.map((hour) => {
            const hourStr = hour < 10 ? `0${hour}:00` : `${hour}:00`;
            const ampm = hour >= 12 ? (hour === 12 ? "12:00 PM" : `${hour - 12}:00 PM`) : `${hour}:00 AM`;

            // Find if any task starts at this hour on this date
            const tasksAtHour = scheduledTasksForDate.filter(t => {
              if (!t.timeBlock) return false;
              const startHour = parseInt(t.timeBlock.start.split(":")[0]);
              return startHour === hour;
            });

            return (
              <div key={hour} className="flex gap-4 border-b border-zinc-900/40 py-3 min-h-[70px]">
                {/* Time Label */}
                <div className="w-16 shrink-0 text-right text-[10px] font-bold text-zinc-500 font-mono mt-0.5">
                  {ampm}
                </div>

                {/* Grid slot (holds tasks) */}
                <div className="flex-1 relative bg-zinc-900/10 rounded-lg min-h-[46px] flex flex-col gap-2">
                  {tasksAtHour.length > 0 ? (
                    tasksAtHour.map(task => {
                      const theme = getCategoryTheme(task.category);
                      return (
                        <div
                          key={task.id}
                          className={`border rounded-xl p-3 shadow-xs flex items-start justify-between gap-2 border-l-4 ${theme}`}
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold block uppercase tracking-wider opacity-75">{task.category}</span>
                            <h4 className="text-xs font-bold truncate leading-tight mt-0.5">{task.title}</h4>
                            <p className="text-[10px] opacity-80 mt-1 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" /> Slot: {task.timeBlock?.start} - {task.timeBlock?.end} ({task.estimatedMinutes} min duration)
                            </p>
                          </div>
                          {task.completed && (
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                              Done
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full border border-dashed border-zinc-800 rounded-lg flex items-center justify-start pl-3 text-[10px] text-zinc-600">
                      Empty Slot
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
