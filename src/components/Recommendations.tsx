import { AlertTriangle, Lightbulb, Zap, Smile, RefreshCw, X } from "lucide-react";
import { ProductivityRecommendation } from "../types";

interface RecommendationsProps {
  recommendations: ProductivityRecommendation[];
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Recommendations({ recommendations, onRefresh, isLoading }: RecommendationsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />;
      case "tip":
        return <Lightbulb className="w-5 h-5 text-sky-500" />;
      case "schedule":
        return <Zap className="w-5 h-5 text-emerald-500" />;
      default:
        return <Smile className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-amber-500/5 border-amber-500/20 text-amber-200";
      case "tip":
        return "bg-sky-500/5 border-sky-500/20 text-sky-200";
      case "schedule":
        return "bg-emerald-500/5 border-emerald-500/20 text-emerald-200";
      default:
        return "bg-indigo-500/5 border-indigo-500/20 text-indigo-200";
    }
  };

  return (
    <div id="ai-recommendations-section" className="bg-[#0D0D0D] backdrop-blur-md rounded-2xl border border-zinc-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100">Aura Proactive Insights</h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 transition-colors py-1 px-2.5 rounded-lg disabled:opacity-50 font-medium cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          Analyze Load
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-6 text-zinc-500 text-sm">
          No insights generated yet. Click "Analyze Load" for Aura to inspect your tasks and habits.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-3.5 rounded-xl border flex gap-3 transition-all hover:shadow-md ${getBgColor(
                rec.type
              )}`}
            >
              <div className="mt-0.5 shrink-0">{getIcon(rec.type)}</div>
              <div>
                <h4 className="font-semibold text-sm leading-tight mb-1">{rec.title}</h4>
                <p className="text-xs opacity-90 leading-relaxed">{rec.text}</p>
                <span className="text-[10px] opacity-60 mt-1 block font-mono">
                  {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
