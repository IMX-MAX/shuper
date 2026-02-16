import React from 'react';
import { CheckCircle2, Circle, ListTodo, X, PanelRightClose, PanelRightOpen, Plus, Trash2 } from 'lucide-react';
import { Task } from '../types';

interface TaskPanelProps {
  tasks: Task[];
  isOpen: boolean;
  onToggle: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ tasks, isOpen, onToggle, onToggleTask, onDeleteTask }) => {
  return (
    <div 
      className={`relative h-full border-l border-[var(--border)] bg-[var(--bg-secondary)] transition-all duration-400 ease-in-out flex flex-col z-20 ${
        isOpen ? 'w-80 opacity-100 shadow-2xl' : 'w-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] flex-shrink-0 bg-[var(--bg-primary)]/40">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[11px] text-[var(--text-muted)] tracking-[0.1em]">Session tasks</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-700">
            <div className="w-14 h-14 mb-6 rounded-3xl bg-[var(--bg-elevated)]/30 flex items-center justify-center text-[var(--text-dim)] border border-[var(--border)] shadow-inner">
              <ListTodo className="w-6 h-6 opacity-20" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-muted)] mb-2 tracking-tight">Focus required</h3>
            <p className="text-[12px] text-[var(--text-dim)] leading-relaxed font-medium">
              Ask Shuper to generate subtasks for this objective. Commands are recognized in natural language.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 mb-5">
              <span className="text-[10px] font-bold text-[var(--text-dim)] tracking-wide">
                {tasks.filter(t => t.completed).length} / {tasks.length} Completed
              </span>
            </div>
            {tasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map((task) => (
              <div 
                key={task.id}
                className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                  task.completed 
                    ? 'bg-[var(--bg-secondary)] border-transparent opacity-40' 
                    : 'bg-[var(--bg-elevated)]/40 border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-elevated)] shadow-sm'
                }`}
              >
                <button 
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 transition-all active:scale-90"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500/70" />
                  ) : (
                    <Circle className="w-4.5 h-4.5 text-[var(--text-dim)] group-hover:text-[var(--text-main)]" />
                  )}
                </button>
                <span className={`text-[13.5px] leading-relaxed flex-1 font-semibold transition-all ${
                  task.completed ? 'text-[var(--text-dim)] line-through' : 'text-[var(--text-main)]'
                }`}>
                  {task.text}
                </span>
                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-red-500/10 text-[var(--text-dim)] hover:text-red-400/80 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-primary)]/20">
        <div className="text-[10px] text-[var(--text-dim)] font-bold text-center leading-relaxed tracking-wide">
          System managed. Re-emit plan to sync.
        </div>
      </div>
    </div>
  );
};