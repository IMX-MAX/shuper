
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Paperclip, 
  ArrowUp, 
  X, 
  Zap, 
  Loader2,
  RefreshCcw,
  ChevronDown,
  Trash2,
  Compass, 
  Square, 
  AlertCircle, 
  AlertTriangle, 
  Circle, 
  Sparkles, 
  Users, 
  Check, 
  BookOpen, 
  PenLine 
} from 'lucide-react';
import { Attachment, Agent, Label, SessionStatus, SessionMode, GEMINI_MODELS, OPENROUTER_FREE_MODELS, DEEPSEEK_MODELS, MOONSHOT_MODELS } from '../types';
import { ModelSelector } from './ModelSelector';
import { StatusSelector, STATUS_CONFIG } from './StatusSelector';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[], useThinking: boolean, mode: SessionMode) => void;
  onStop?: () => void;
  isLoading: boolean;
  currentStatus: SessionStatus;
  currentLabelIds: string[];
  availableLabels: Label[];
  onUpdateStatus: (status: SessionStatus) => void;
  onUpdateLabels: (labelId: string) => void;
  onCreateLabel: (label: Label) => void;
  visibleModels: string[];
  agents: Agent[];
  currentModel: string;
  onSelectModel: (model: string) => void;
  sendKey: 'Enter' | 'Ctrl+Enter';
  hasOpenRouterKey?: boolean;
  hasDeepSeekKey?: boolean;
  hasMoonshotKey?: boolean;
  currentMode: SessionMode;
  onUpdateMode: (mode: SessionMode) => void;
  onUpdateCouncilModels?: (models: string[]) => void;
  hasAnyKey?: boolean;
  onUpArrow?: () => void;
  externalValue?: string;
  councilModels?: string[];
  draftValue: string;
  onDraftChange: (val: string) => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
    onSend, 
    onStop,
    isLoading,
    currentStatus,
    currentLabelIds,
    availableLabels,
    onUpdateStatus,
    onUpdateLabels,
    visibleModels,
    agents,
    currentModel,
    onSelectModel,
    sendKey,
    hasOpenRouterKey,
    hasDeepSeekKey,
    hasMoonshotKey,
    currentMode,
    onUpdateMode,
    onUpdateCouncilModels,
    hasAnyKey = true,
    onUpArrow,
    externalValue,
    councilModels = [],
    draftValue,
    onDraftChange,
    isEditing = false,
    onCancelEdit
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [localText, setLocalText] = useState(draftValue);
  
  // Ref to track the version of draft we've successfully synced to parent
  const lastSyncedDraft = useRef(draftValue);
  
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isCouncilPickerOpen, setIsCouncilPickerOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusBtnRef = useRef<HTMLButtonElement>(null);

  // Synchronize when switching sessions (draftValue changes drastically)
  useEffect(() => {
    if (draftValue !== lastSyncedDraft.current) {
        setLocalText(draftValue);
        lastSyncedDraft.current = draftValue;
    }
  }, [draftValue]);

  // Synchronize external values (edits or prompt commands)
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== null && externalValue !== '') {
      setLocalText(externalValue);
      lastSyncedDraft.current = externalValue;
      // Use requestAnimationFrame to ensure focus happens after DOM updates
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(externalValue.length, externalValue.length);
        }
      });
    }
  }, [externalValue]);

  // Debounced sync back to parent for persistence (1s for performance)
  useEffect(() => {
    const handler = setTimeout(() => {
        if (localText !== lastSyncedDraft.current) {
            lastSyncedDraft.current = localText;
            onDraftChange(localText);
        }
    }, 1000);
    return () => clearTimeout(handler);
  }, [localText, onDraftChange]);

  // Surgical Global Auto-Focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        // 1. Exit if an input is already focused
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

        // 2. Exit if it's a modifier key combo
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        
        // 3. Focus if it's a printable character
        if (e.key.length === 1) {
            textareaRef.current?.focus();
        }
    };
    
    // Use capture to catch it before other elements
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const isCurrentModelValid = useMemo(() => {
    if (!currentModel && currentMode !== 'council') return false;
    if (currentMode === 'council') return !!process.env.API_KEY;
    const agent = agents.find(a => a.id === currentModel);
    const targetModelId = agent ? agent.baseModel : currentModel;
    if (GEMINI_MODELS.includes(targetModelId)) return !!process.env.API_KEY;
    if (OPENROUTER_FREE_MODELS.includes(targetModelId) || targetModelId.includes(':free')) return !!hasOpenRouterKey;
    if (DEEPSEEK_MODELS.includes(targetModelId)) return !!hasDeepSeekKey;
    if (MOONSHOT_MODELS.includes(targetModelId)) return !!hasMoonshotKey;
    return false;
  }, [currentModel, currentMode, agents, hasOpenRouterKey, hasDeepSeekKey, hasMoonshotKey]);

  // Direct DOM manipulation for height to avoid React re-render cycle stutters
  const updateHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const scrollHeight = el.scrollHeight;
      const finalHeight = Math.max(34, Math.min(scrollHeight, 200)); 
      el.style.height = `${finalHeight}px`;
      el.style.overflowY = scrollHeight > 200 ? 'auto' : 'hidden';
    }
  }, []);

  useEffect(() => {
    updateHeight();
  }, [localText, updateHeight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasAnyKey) return;
    if (e.key === 'ArrowUp' && localText.trim() === '' && onUpArrow) {
      e.preventDefault();
      onUpArrow();
      return;
    }
    if (e.key === 'Escape' && isEditing && onCancelEdit) {
        onCancelEdit();
        return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
        if (sendKey === 'Enter' && !e.ctrlKey) {
            e.preventDefault();
            handleSend();
        } else if (sendKey === 'Ctrl+Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSend();
        }
    }
  };

  const handleSend = () => {
      if (!hasAnyKey) return;
      if (isLoading) {
          onStop?.();
          return;
      }
      if (!localText.trim() && attachments.length === 0) return;
      
      const textToSend = localText;
      onSend(textToSend, attachments, currentMode === 'execute', currentMode);
      
      setLocalText('');
      lastSyncedDraft.current = '';
      onDraftChange('');
      setAttachments([]);
      
      if (textareaRef.current) {
          textareaRef.current.style.height = '34px';
          textareaRef.current.style.overflowY = 'hidden';
      }
  };

  const toggleCouncilModel = (m: string) => {
    if (!onUpdateCouncilModels) return;
    const newModels = councilModels.includes(m) 
        ? councilModels.filter(x => x !== m) 
        : (councilModels.length < 3 ? [...councilModels, m] : [councilModels[1], councilModels[2], m]);
    onUpdateCouncilModels(newModels);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          Array.from(e.target.files).forEach((file: File) => {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                  if (readerEvent.target?.result) {
                      setAttachments(prev => [...prev, {
                          name: file.name,
                          type: file.type,
                          data: readerEvent.target!.result as string,
                          size: file.size
                      }]);
                  }
              };
              reader.readAsDataURL(file);
          });
      }
  };

  const activeAgent = agents.find(a => a.id === currentModel);
  const getModelNameDisplay = () => {
    if (currentMode === 'council') return `Council (${councilModels.length}/3)`;
    if (!isCurrentModelValid) return "Key Required";
    if (activeAgent) return activeAgent.name;
    const parts = currentModel.split('/');
    return parts[parts.length - 1].split(':')[0];
  };

  const getStatusBtnCoords = () => {
    if (statusBtnRef.current) {
        const rect = statusBtnRef.current.getBoundingClientRect();
        return { bottom: (window.innerHeight - rect.top) + 8, left: rect.left };
    }
    return { bottom: '100%', left: 0, marginBottom: '8px' };
  };

  const ModeIcon = currentMode === 'explore' ? Compass : (currentMode === 'execute' ? RefreshCcw : Users);

  return (
    <div id="tour-input-area" className="w-full max-w-3xl floating-input-shadow rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] overflow-visible relative">
      {isEditing && (
          <div className="absolute -top-8 left-0 right-0 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full px-4 py-1 flex items-center gap-2 text-[11px] font-bold text-[var(--text-main)] shadow-lg">
                  <PenLine className="w-3 h-3 text-[var(--accent)]" />
                  <span>Editing Message</span>
                  <div className="h-3 w-[1px] bg-[var(--border)] mx-1" />
                  <button onClick={onCancelEdit} className="text-[var(--text-dim)] hover:text-red-400 transition-colors uppercase tracking-wider">Cancel</button>
              </div>
          </div>
      )}

      {attachments.length > 0 && (
          <div className="flex gap-2 p-2 px-3 overflow-x-auto custom-scrollbar border-b border-[var(--border)]">
              {attachments.map((att, index) => (
                  <div key={index} className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[11px] text-[var(--text-main)] flex-shrink-0 animate-in zoom-in-95 duration-200">
                      <div className="w-4 h-4 bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center rounded">
                          <Paperclip className="w-2.5 h-2.5" />
                      </div>
                      <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                      <button 
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                          className="hover:bg-[var(--bg-tertiary)] p-0.5 rounded transition-colors text-[var(--text-dim)] hover:text-red-400"
                      >
                          <X className="w-3 h-3" />
                      </button>
                  </div>
              ))}
          </div>
      )}

      <div className="p-2.5">
        <div className="flex items-center justify-between mb-1.5">
            <div className="relative">
                <button 
                  onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                  className="flex items-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-xl border border-[var(--border)] text-[10px] font-black text-[var(--text-muted)] tracking-widest transition-all active:scale-95 group"
                >
                  <ModeIcon className="w-3 h-3 transition-transform" />
                  <span className="capitalize">{currentMode}</span>
                  <ChevronDown className={`w-2.5 h-2.5 opacity-30 transition-transform duration-200 ${isModeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isModeMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsModeMenuOpen(false)} />
                        <div className="absolute bottom-full left-0 mb-3 w-44 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-bottom-left backdrop-blur-xl">
                            <div onClick={() => { onUpdateMode('explore'); setIsModeMenuOpen(false); }} className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${currentMode === 'explore' ? 'bg-[var(--bg-elevated)] text-[var(--text-main)]' : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'}`}>
                                <span className="text-[11px] font-bold">Explore</span>
                                <Compass className="w-3.5 h-3.5" />
                            </div>
                            <div onClick={() => { onUpdateMode('execute'); setIsModeMenuOpen(false); }} className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${currentMode === 'execute' ? 'bg-[var(--bg-elevated)] text-[var(--text-main)]' : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'}`}>
                                <span className="text-[11px] font-bold">Execute</span>
                                <RefreshCcw className="w-3.5 h-3.5" />
                            </div>
                            <div onClick={() => { onUpdateMode('council'); setIsModeMenuOpen(false); }} className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${currentMode === 'council' ? 'bg-[var(--bg-elevated)] text-[var(--text-main)]' : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'}`}>
                                <span className="text-[11px] font-bold">Council</span>
                                <Users className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            <div className="flex items-center gap-1.5">
                <button 
                    ref={statusBtnRef}
                    onClick={() => setIsStatusMenuOpen(true)}
                    className="p-1.5 rounded-full hover:bg-[var(--bg-elevated)] transition-all group active:scale-90"
                >
                    <Circle className={`w-3.5 h-3.5 ${STATUS_CONFIG[currentStatus].color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                </button>
                <StatusSelector isOpen={isStatusMenuOpen} onClose={() => setIsStatusMenuOpen(false)} currentStatus={currentStatus} onSelect={onUpdateStatus} position={getStatusBtnCoords()} />
            </div>
        </div>

        <textarea
          ref={textareaRef}
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Working..." : "What's on your mind?"}
          className="w-full bg-transparent border-0 text-[var(--text-main)] placeholder-[var(--text-dim)] px-2.5 py-1 focus:ring-0 focus:outline-none resize-none min-h-[34px] max-h-[200px] custom-scrollbar text-[15px] font-medium leading-relaxed overflow-hidden transition-all duration-200 ease-out"
          rows={1}
        />

        <div className="flex items-center justify-between mt-1 px-1">
            <div className="flex items-center gap-2">
                <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    accept="application/pdf,image/jpeg,image/png,image/webp,text/plain"
                />
                <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-xl text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-all"><Paperclip className="w-4.5 h-4.5" /></button>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <button 
                        id="tour-model-selector"
                        onClick={() => currentMode === 'council' ? setIsCouncilPickerOpen(true) : setIsModelMenuOpen(!isModelMenuOpen)}
                        className={`text-[10px] font-black tracking-[0.05em] flex items-center gap-1.5 transition-all px-2 py-1 rounded-lg hover:bg-[var(--bg-elevated)] ${!isCurrentModelValid ? 'text-red-400' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
                    >
                        <span className="max-w-[150px] truncate uppercase">{getModelNameDisplay()}</span>
                        <ChevronDown className="w-2.5 h-2.5 opacity-30" />
                    </button>
                    {currentMode === 'council' ? (
                        isCouncilPickerOpen && (
                            <>
                                <div className="fixed inset-0 z-[100]" onClick={() => setIsCouncilPickerOpen(false)} />
                                <div className="absolute bottom-full right-0 mb-3 w-64 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl p-4 z-[110] animate-in fade-in zoom-in-95 origin-bottom-right">
                                    <h4 className="text-[10px] font-black uppercase text-[var(--text-dim)] mb-3 tracking-widest px-1">Select 3 Models</h4>
                                    <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                                        {[...GEMINI_MODELS, ...OPENROUTER_FREE_MODELS].map(mId => (
                                            <div key={mId} onClick={() => toggleCouncilModel(mId)} className="flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-secondary)] rounded-xl cursor-pointer group transition-colors">
                                                <span className={`text-[12px] font-bold truncate max-w-[160px] ${councilModels.includes(mId) ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{mId.split('/').pop()?.split(':')[0]}</span>
                                                {councilModels.includes(mId) && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between px-1">
                                        <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase">Ready to deliberate</span>
                                        <button onClick={() => setIsCouncilPickerOpen(false)} className="px-3 py-1 bg-[var(--text-main)] text-[var(--bg-primary)] rounded-lg text-[10px] font-bold">Done</button>
                                    </div>
                                </div>
                            </>
                        )
                    ) : (
                        <ModelSelector isOpen={isModelMenuOpen} onClose={() => setIsModelMenuOpen(false)} currentModel={currentModel} onSelect={onSelectModel} visibleModels={visibleModels} agents={agents} hasOpenRouterKey={hasOpenRouterKey} hasDeepSeekKey={hasDeepSeekKey} hasMoonshotKey={hasMoonshotKey} />
                    )}
                </div>
                <button 
                    onClick={handleSend} 
                    disabled={(!localText.trim() && attachments.length === 0 && !isLoading) || !isCurrentModelValid}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${((!localText.trim() && attachments.length === 0 && !isLoading) || !isCurrentModelValid) ? 'bg-[var(--bg-elevated)] text-[var(--text-dim)] opacity-50' : 'bg-[var(--accent)] text-[var(--bg-primary)] hover:scale-105 shadow-lg active:scale-95'}`}
                >
                    {isLoading ? <div className="w-2.5 h-2.5 bg-current rounded-[1px] animate-pulse" /> : (isEditing ? <Check className="w-4 h-4" strokeWidth={3} /> : <ArrowUp className="w-4 h-4" strokeWidth={2.5} />)}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};