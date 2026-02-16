import React from 'react';
import { X, Check, RefreshCcw, Layout, MessageSquare, Tag, Camera, Sparkles } from 'lucide-react';

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
                <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">Version 2.4.0</p>
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
                     <Camera className="w-5 h-5 text-[#A78BFA]" />
                 </div>
             </div>
             <div>
                 <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Custom Branding</h3>
                 <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                     Upload your own workspace icon in Settings to fully personalize your environment.
                 </p>
             </div>
          </div>

          <div className="flex gap-5">
             <div className="flex-shrink-0">
                 <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border)] shadow-sm">
                     <Sparkles className="w-5 h-5 text-[#10B981]" />
                 </div>
             </div>
             <div>
                 <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">AI Triage (Labels)</h3>
                 <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                     Let Shuper suggest labels based on your conversation. Just hit 'Suggest with AI' in the tags menu.
                 </p>
             </div>
          </div>

          <div className="flex gap-5">
             <div className="flex-shrink-0">
                 <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border)] shadow-sm">
                     <Layout className="w-5 h-5 text-[var(--accent)]" />
                 </div>
             </div>
             <div>
                 <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Fluid Sidebar</h3>
                 <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                     New collapsing animations for Status and Labels categories for a cleaner, high-focus workflow.
                 </p>
             </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3">
           <button 
              onClick={onClose}
              className="w-full py-4 bg-white text-black rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-black/20"
           >
               Synchronize Workspace
           </button>
        </div>
      </div>
    </>
  );
};