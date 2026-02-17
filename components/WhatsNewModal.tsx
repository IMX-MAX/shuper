
import React from 'react';
import { X, Check, RefreshCcw, Layout, MessageSquare, Tag, Camera, Sparkles, Bot, Plug, FileCode, Globe } from 'lucide-react';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed z-[70] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-xl">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-[var(--text-main)]">Latest Build</h2>
                <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">Version 2.6.0</p>
             </div>
          </div>
          <button 
             onClick={onClose}
             className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all"
          >
             <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-8">
          <div className="flex gap-5">
             <div className="flex-shrink-0">
                 <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border)] shadow-sm">
                     <Globe className="w-5 h-5 text-[#A78BFA]" />
                 </div>
             </div>
             <div>
                 <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Tavily Search Integration</h3>
                 <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                     Now you can choose Tavily as a search provider alongside Scira and Exa. Add your API key in Settings &gt; AI.
                 </p>
             </div>
          </div>

          <div className="flex gap-5">
             <div className="flex-shrink-0">
                 <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border)] shadow-sm">
                     <Plug className="w-5 h-5 text-[#10B981]" />
                 </div>
             </div>
             <div>
                 <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Tool Integrations</h3>
                 <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                     Connect your agents to the world. Native support for MCP Servers, Linear, and custom API integrations.
                 </p>
             </div>
          </div>

          <div className="flex gap-5">
             <div className="flex-shrink-0">
                 <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border)] shadow-sm">
                     <Bot className="w-5 h-5 text-[var(--accent)]" />
                 </div>
             </div>
             <div>
                 <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Intelligence Factory</h3>
                 <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                     A completely redesigned Agents view. Create, manage, and tune your assistants in a powerful split-pane editor.
                 </p>
             </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3">
           <button 
              onClick={onClose}
              className="w-full py-4 bg-white text-black rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-black/20"
           >
               Got it
           </button>
        </div>
      </div>
    </>
  );
};
