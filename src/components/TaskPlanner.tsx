import { useState, FormEvent } from "react";
import { 
  Plus, Clock, Calendar, AlertCircle, Trash2, ListTodo, Sparkles, 
  CheckSquare, Square, ChevronDown, ChevronUp, FileText, Play, CheckCircle2, RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, SubTask } from "../types";

interface TaskPlannerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "createdTime" | "completed" | "subtasks" | "timeBlock">) => void;
  onUpdateTasks: (tasks: Task[]) => void;
  onDeleteTask: (id: string) => void;
  onTriggerPrioritization: () => void;
  onDecomposeTask: (taskId: string) => void;
  onExecuteSubtask: (taskId: string, subtaskId: string) => void;
  isPrioritizing: boolean;
  isDecomposingId: string | null;
  isExecutingId: string | null;
}

export default function TaskPlanner({
  tasks,
  onAddTask,
  onUpdateTasks,
  onDeleteTask,
  onTriggerPrioritization,
  onDecomposeTask,
  onExecuteSubtask,
  isPrioritizing,
  isDecomposingId,
  isExecutingId
}: TaskPlannerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Work");
  const [deadline, setDeadline] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<{ title: string; content: string } | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      title,
      description,
      category,
      deadline: deadline || new Date().toISOString().split("T")[0],
      estimatedMinutes: Number(estimatedMinutes),
      priority
    });
    setTitle("");
    setDescription("");
    setDeadline("");
    setEstimatedMinutes(30);
  };

  const toggleTaskCompletion = (task: Task) => {
    const updated = tasks.map(t => {
      if (t.id === task.id) {
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined
        };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  const toggleSubtaskCompletion = (taskId: string, subtaskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          )
        };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "medium": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-zinc-800/80 text-zinc-400 border-zinc-700/60";
    }
  };

  const getCategoryBadge = (cat: string) => {
    const colors: { [key: string]: string } = {
      Work: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      Personal: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      Health: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      Study: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20"
    };
    return colors[cat] || "bg-zinc-800/80 text-zinc-400 border-zinc-700/60";
  };

  return (
    <div id="task-planner-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Task Creation Form (Left Column) */}
      <div className="lg:col-span-4 bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm h-fit">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Plus className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100">Add New Task</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Draft quarterly proposal"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 focus:border-zinc-750"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Description</label>
            <textarea
              placeholder="Provide context or key goals for this task..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 text-sm border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 focus:border-zinc-750 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-800 rounded-xl bg-zinc-900/60 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 [&_option]:bg-zinc-950 [&_option]:text-zinc-100"
              >
                <option value="Work">💼 Work</option>
                <option value="Personal">🏡 Personal</option>
                <option value="Health">💪 Health</option>
                <option value="Study">📚 Study</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Base Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-zinc-800 rounded-xl bg-zinc-900/60 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 [&_option]:bg-zinc-950 [&_option]:text-zinc-100"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Deadline Date</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-800 rounded-xl bg-zinc-900/60 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Est. Minutes</label>
              <input
                type="number"
                min="5"
                max="480"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-zinc-800 rounded-xl bg-zinc-900/60 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </form>
      </div>

      {/* Task Queue / Autonomous Execution Panel (Right Column) */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* Prioritize Bar */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-3 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">Let Aura dynamically rank and justify your tasks.</span>
          </div>
          <button
            onClick={onTriggerPrioritization}
            disabled={isPrioritizing || tasks.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-1.5 px-3 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            {isPrioritizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Prioritize & Align
          </button>
        </div>

        {/* Task List */}
        <div className="bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <ListTodo className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-zinc-100">Your Active Task Queue ({tasks.filter(t => !t.completed).length})</h3>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-sm">
              Your task queue is clean and clear. Add a task to start organizing with Aura!
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                    task.completed 
                      ? "bg-zinc-950/60 border-zinc-900/80 opacity-60" 
                      : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:shadow-sm"
                  }`}
                >
                  <div className="p-4 flex items-start gap-3 justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => toggleTaskCompletion(task)}
                        className="mt-0.5 shrink-0 text-zinc-500 hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2 items-center mb-1">
                          <span className={`text-sm font-semibold truncate ${task.completed ? "line-through text-zinc-650" : "text-zinc-100"}`}>
                            {task.title}
                          </span>
                          <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-md ${getPriorityColor(task.priority)}`}>
                            {task.priority.toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-md ${getCategoryBadge(task.category)}`}>
                            {task.category}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.estimatedMinutes} mins
                          </span>
                          <span className="flex items-center gap-1 font-medium text-zinc-400">
                            <Calendar className="w-3 h-3" /> Due: {task.deadline}
                          </span>
                          {task.timeBlock && (
                            <span className="flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                              ⚡ Scheduled: {task.timeBlock.start} - {task.timeBlock.end}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                        className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        {expandedTaskId === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Subtask Decomposer & Execution Area */}
                  {expandedTaskId === task.id && (
                    <div className="border-t border-zinc-800 bg-zinc-900/30 p-4 space-y-4">
                      {/* AI Reasoning justification */}
                      {task.aiReasoning && (
                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-2.5">
                          <p className="text-[11px] text-indigo-300 leading-relaxed font-medium">
                            <Sparkles className="w-3 h-3 inline mr-1 text-indigo-400" />
                            <strong>Aura Analysis:</strong> {task.aiReasoning}
                          </p>
                        </div>
                      )}

                      {/* Subtask Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subtask Decomposition Plan</span>
                        {task.subtasks.length === 0 && (
                          <button
                            onClick={() => onDecomposeTask(task.id)}
                            disabled={isDecomposingId === task.id}
                            className="text-xs text-indigo-400 hover:text-indigo-350 font-semibold flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-850 shadow-sm cursor-pointer"
                          >
                            {isDecomposingId === task.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Autonomous Decompose
                          </button>
                        )}
                      </div>

                      {/* Subtasks checklist */}
                      {task.subtasks.length > 0 && (
                        <div className="space-y-2">
                          {task.subtasks.map((st) => (
                            <div key={st.id} className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleSubtaskCompletion(task.id, st.id)}
                                  className="text-zinc-500 hover:text-indigo-400 shrink-0 cursor-pointer"
                                >
                                  {st.completed ? <CheckCircle2 className="w-4 h-4 text-indigo-400" /> : <div className="w-4 h-4 border border-zinc-700 rounded-full" />}
                                </button>
                                <span className={`text-xs text-zinc-300 ${st.completed ? "line-through text-zinc-600" : ""}`}>
                                  {st.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {st.executionOutput ? (
                                  <button
                                    onClick={() => setActiveDraft({ title: st.title, content: st.executionOutput! })}
                                    className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer"
                                  >
                                    <FileText className="w-3 h-3" /> View Draft
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => onExecuteSubtask(task.id, st.id)}
                                    disabled={isExecutingId === st.id}
                                    className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-450 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                                  >
                                    {isExecutingId === st.id ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
                                    Auto Draft
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Execution Drawer / Overlay for Viewing generated template content */}
      <AnimatePresence>
        {activeDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setActiveDraft(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0D0D] rounded-2xl shadow-xl border border-zinc-800 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-zinc-100 truncate">Aura Auto Draft: {activeDraft.title}</h3>
                </div>
                <button
                  onClick={() => setActiveDraft(null)}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap bg-zinc-950 text-zinc-100 border border-zinc-850 max-h-[60vh]">
                {activeDraft.content}
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeDraft.content);
                    alert("Draft copied to clipboard!");
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setActiveDraft(null)}
                  className="px-3.5 py-1.5 border border-zinc-800 text-zinc-450 hover:bg-zinc-900 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface XProps {
  className?: string;
}

function X({ className }: XProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );
}
