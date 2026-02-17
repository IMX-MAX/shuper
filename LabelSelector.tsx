import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Label } from '../types';

interface LabelSelectorProps {
  availableLabels: Label[];
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  onSuggestWithAI: () => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  position?: { top: number; left: number };
}

export const LabelSelector: React.FC<LabelSelectorProps> = ({ 
  availableLabels, 
  selectedLabelIds, 
  onToggleLabel, 
  onSuggestWithAI,
  onClose,
  isOpen,
  position 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              onClose();
          }
      };
      if (isOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleAISuggest = async () => {
    setIsSuggesting(true);
    try {
      await onSuggestWithAI();
    } finally {
      setIsSuggesting(false);
    }
  };

  if (!isOpen) return null;

  const style: React.CSSProperties = position 
    ? { top: position.top, left: position.left, position: 'fixed' } 
    : { bottom: '100%', right: 0, marginBottom: '8px', transformOrigin: 'bottom right', position: 'absolute' };

  const content = (
    <div 
        ref={menuRef}
        className="z-[99999] w-64 bg-[#1A1A1A] border border-[#333] rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        style={style}
    >
      <div className="px-4 py-2.5 border-b border-[#262626] flex items-center justify-between">
         <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Tags</span>
      </div>
      
      <div className="max-h-[260px] overflow-y-auto py-1.5 custom-scrollbar">
        {availableLabels.length === 0 ? (
            <div className="px-5 py-6 text-xs text-[#525252] italic text-center leading-relaxed">No tags found.<br/>Add some in Settings.</div>
        ) : (
          availableLabels.map(label => {
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                  <div 
                      key={label.id}
                      onClick={() => onToggleLabel(label.id)}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-[#262626] cursor-pointer group transition-colors"
                  >
                      <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: label.color }}></div>
                          <span className={`text-[13px] font-medium ${isSelected ? 'text-white' : 'text-[#A1A1A1] group-hover:text-white'}`}>{label.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--text-main)]" />}
                  </div>
              );
          })
        )}
      </div>

      <div className="px-2 pt-1 pb-1 border-t border-[#262626] mt-1">
        <button 
          onClick={handleAISuggest}
          disabled={isSuggesting || availableLabels.length === 0}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[11px] font-bold text-[var(--text-main)] hover:bg-[var(--text-main)]/10 transition-colors disabled:opacity-40 group"
        >
          {isSuggesting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          )}
          <span>{isSuggesting ? 'Thinking...' : 'Tag automatically'}</span>
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};