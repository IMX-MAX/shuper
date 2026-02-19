
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
  PenLine,
  Database,
  AppWindow,
  FileText,
  Globe
} from 'lucide-react';
import { Attachment, Agent, Label, SessionStatus, SessionMode, GEMINI_MODELS, OPENROUTER_FREE_MODELS, ROUTEWAY_MODELS, MODEL_FRIENDLY_NAMES } from '../types';
import { ModelSelector } from './ModelSelector';
import { StatusSelector, STATUS_CONFIG } from './StatusSelector';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[], useThinking: boolean, mode: SessionMode, useSearch: boolean, searchProvider: 'scira' | 'exa' | 'tavily') => void;
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
  hasRoutewayKey?: boolean;
  hasSciraKey?: boolean;
  hasExaKey?: boolean;
  hasTavilyKey?: boolean;
  currentMode: SessionMode;
  onUpdateMode: (mode: SessionMode) => void;
  useSearch: boolean;
  onUpdateSearch: (useSearch: boolean) => void;
  searchProvider: 'scira' | 'exa' | 'tavily';
  onUpdateSearchProvider: (provider: 'scira' | 'exa' | 'tavily') => void;
  onUpdateCouncilModels?: (models: string[]) => void;
  hasAnyKey?: boolean;
  onUpArrow?: () => void;
  externalValue?: string;
  councilModels?: string[];
  draftValue: string;
  onDraftChange: (val: string) => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onOpenSettings?: () => void;
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
    hasRoutewayKey,
    hasSciraKey,
    hasExaKey,
    hasTavilyKey,
    currentMode,
    onUpdateMode,
    useSearch,
    onUpdateSearch,
    searchProvider,
    onUpdateSearchProvider,
    onUpdateCouncilModels,
    hasAnyKey = true,
    onUpArrow,
    externalValue,
    councilModels = [],
    draftValue,
    onDraftChange,
    isEditing = false,
    onCancelEdit,
    onOpenSettings
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [localText, setLocalText] = useState(draftValue);
  
  // Auto-select valid provider if current one is missing key
  useEffect(() => {
      if (searchProvider === 'scira' && !hasSciraKey) {
          if (hasExaKey) onUpdateSearchProvider('exa');
          else if (hasTavilyKey) onUpdateSearchProvider('tavily');
      } else if (searchProvider === 'exa' && !hasExaKey) {
          if (hasSciraKey) onUpdateSearchProvider('scira');
          else if (hasTavilyKey) onUpdateSearchProvider('tavily');
      } else if (searchProvider === 'tavily' && !hasTavilyKey) {
          if (hasSciraKey) onUpdateSearchProvider('scira');
          else if (hasExaKey) onUpdateSearchProvider('exa');
      }
  }, [hasSciraKey, hasExaKey, hasTavilyKey, searchProvider, onUpdateSearchProvider]);

  const lastSyncedDraft = useRef(draftValue);
  const localTextRef = useRef(localText);
  const onDraftChangeRef = useRef(onDraftChange);
  
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isCouncilPickerOpen, setIsCouncilPickerOpen] = useState(false);
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusBtnRef = useRef<HTMLButtonElement>(null);

  // Keep refs up to date for cleanup
  useEffect(() => { localTextRef.current = localText; }, [localText]);
  useEffect(() => { onDraftChangeRef.current = onDraftChange; }, [onDraftChange]);

  // Handle external draft updates (switching sessions)
  useEffect(() => {
    if (draftValue !== lastSyncedDraft.current) {
        setLocalText(draftValue);
        lastSyncedDraft.current = draftValue;
        localTextRef.current = draftValue;
    }
  }, [draftValue]);

  useEffect(() => {
    if (externalValue !== undefined && externalValue !== null && externalValue !== '') {
      setLocalText(externalValue);
      lastSyncedDraft.current = externalValue;
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(externalValue.length, externalValue.length);
        }
      });
    }
  }, [externalValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
        if (localText !== lastSyncedDraft.current) {
            lastSyncedDraft.current = localText;
            onDraftChange(localText);
        }
    }, 1000);
    return () => clearTimeout(handler);
  }, [localText, onDraftChange]);

  // Flush unsaved draft changes on unmount
  useEffect(() => {
      return () => {
          if (localTextRef.current !== lastSyncedDraft.current) {
              onDraftChangeRef.current(localTextRef.current);
          }
      };
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key.length === 1) {
            textareaRef.current?.focus();
        }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const isCurrentModelValid = useMemo(() => {
    if (!currentModel && currentMode !== 'council') return false;
    if (currentMode === 'council') return !!process.env.API_KEY;
    const agent = agents.find(a => a.id === currentModel);
    const targetModelId = agent ? agent.baseModel : currentModel;
    if (GEMINI_MODELS.includes(targetModelId)) return !!process.env.API_KEY;
    if (OPENROUTER_FREE_MODELS.includes(targetModelId) || targetModelId.includes(':free') && !ROUTEWAY_MODELS.includes(targetModelId)) return !!hasOpenRouterKey;
    if (ROUTEWAY_MODELS.includes(targetModelId)) return !!hasRoutewayKey;
    return false;
  }, [currentModel, currentMode, agents, hasOpenRouterKey, hasRoutewayKey]);

  const updateHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const scrollHeight = el.scrollHeight;
      // Allow enough height for 3 lines comfortably (around 70-80px), min-height 60px
      const finalHeight = Math.max(64, Math.min(scrollHeight, 240)); 
      el.style.height = `${finalHeight}px`;
      el.style.overflowY = scrollHeight > 240 ? 'auto' : 'hidden';
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

  const handlePaste = (e: React.ClipboardEvent) => {
      const pastedText = e.clipboardData.getData('text');
      if (pastedText && pastedText.length > 250) {
          e.preventDefault();
          const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-');
          const fileName = `Snippet ${timestamp}.txt`;
          
          // Safe Base64 encoding for UTF-8 strings
          const base64Data = btoa(unescape(encodeURIComponent(pastedText)));
          const dataUrl = `data:text/plain;base64,${base64Data}`;
          
          setAttachments(prev => [...prev, {
              name: fileName,
              type: 'text/plain',
              data: dataUrl,
              size: new Blob([pastedText]).size
          }]);
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
      onSend(textToSend, attachments, currentMode === 'execute', currentMode, useSearch, searchProvider);
      
      setLocalText('');
      lastSyncedDraft.current = '';
      onDraftChange('');
      setAttachments([]);
      // Keep search state active until manually toggled off
      
      if (textareaRef.current) {
          textareaRef.current.style.height = '64px';
          textareaRef.current.style.overflowY = 'hidden';
      }
  };

  // Only consider models that are currently visible/enabled
  const validCouncilModels = useMemo(() => {
    return councilModels.filter(m => visibleModels.includes(m));
  }, [councilModels, visibleModels]);

  const toggleCouncilModel = (m: string) => {
    if (!onUpdateCouncilModels) return;
    
    // Work with valid models only to ensure we don't count hidden/disabled ones towards the limit
    let newModels: string[] = [];
    
    if (validCouncilModels.includes(m)) {
        newModels = validCouncilModels.filter(x => x !== m);
    } else {
        if (validCouncilModels.length < 3) {
            newModels = [...validCouncilModels, m];
        } else {
            // Shift out the first one, keep the rest, add new one
            newModels = [validCouncilModels[1], validCouncilModels[2], m];
        }
    }
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
    if (currentMode === 'council') return `Council (${validCouncilModels.length}/3)`;
    if (!currentModel) return "Select Model"; 
    if (!isCurrentModelValid) return "Key Required";
    if (activeAgent) return activeAgent.name;
    return MODEL_FRIENDLY_NAMES[currentModel] || currentModel.split('/').pop()?.split(':')[0] || currentModel;
  };

  const getStatusBtnCoords = () => {
    if (statusBtnRef.current) {
        const rect = statusBtnRef.current.getBoundingClientRect();
        return { bottom: (window.innerHeight - rect.top) + 8, left: rect.left };
    }
    return { bottom: '100%', left: 0, marginBottom: '8px' };
  };

  const ModeIcon = currentMode === 'explore' ? Compass : (currentMode === 'execute' ? RefreshCcw : Users);
  const StatusIcon = STATUS_CONFIG[currentStatus].icon;

  const hasSearchKey = hasSciraKey || hasExaKey || hasTavilyKey;

  return (
    <div id="tour-input-area" className="w-full max-w-3xl floating-input-shadow rounded-3xl bg-[var(--input-bg)] border border-[var(--border)] overflow-visible relative flex flex-col">
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

      {/* Header with Mode and Status */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <div className="relative">
              <button 
                onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group"
              >
                <ModeIcon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="capitalize">{currentMode}</span>
                <ChevronDown className={`w-3 h-3 opacity-30 transition-transform duration-200 ${isModeMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isModeMenuOpen && (
                  <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsModeMenuOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 w-44 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-left backdrop-blur-xl">
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
                  className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group"
              >
                  <StatusIcon className={`w-3.5 h-3.5 ${STATUS_CONFIG[currentStatus].color}`} />
                  <span className="capitalize">{STATUS_CONFIG[currentStatus].label}</span>
                  <ChevronDown className="w-3 h-3 opacity-30" />
              </button>
              <StatusSelector isOpen={isStatusMenuOpen} onClose={() => setIsStatusMenuOpen(false)} currentStatus={currentStatus} onSelect={onUpdateStatus} position={getStatusBtnCoords()} />
          </div>
      </div>

      {attachments.length > 0 && (
          <div className="flex gap-2 p-3 px-5 overflow-x-auto custom-scrollbar">
              {attachments.map((att, index) => (
                  <div key={index} className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[11px] text-[var(--text-main)] flex-shrink-0 animate-in zoom-in-95 duration-200">
                      <div className="w-4 h-4 bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center rounded">
                          {att.type.startsWith('text/') ? <FileText className="w-2.5 h-2.5" /> : <Paperclip className="w-2.5 h-2.5" />}
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

      <div className="px-5 py-2">
        <textarea
          ref={textareaRef}
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isLoading ? "Working..." : "Ask anything..."}
          className="w-full bg-transparent border-0 text-[var(--text-main)] placeholder-[var(--text-dim)] px-0 py-0 focus:ring-0 focus:outline-none resize-none min-h-[64px] max-h-[240px] custom-scrollbar text-[13px] leading-relaxed font-medium overflow-hidden transition-all duration-200 ease-out"
          rows={1}
        />
      </div>

      <div className="px-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect} 
                  accept="application/pdf,image/jpeg,image/png,image/webp,text/plain"
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              {/* Search Toggle with Provider Menu */}
              <div id="tour-web-search" className="relative flex items-center gap-1">
                  <button 
                    onClick={() => hasSearchKey && onUpdateSearch(!useSearch)}
                    disabled={!hasSearchKey}
                    className={`transition-all duration-300 flex items-center gap-1.5 ${useSearch ? 'text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'} ${!hasSearchKey ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title={hasSearchKey ? `Toggle Search (${searchProvider === 'scira' ? 'Scira' : (searchProvider === 'exa' ? 'Exa' : 'Tavily')})` : "Search key required (Settings)"}
                  >
                    <Globe className="w-5 h-5" />
                  </button>
                  
                  {/* Allow dropdown if at least TWO providers are available */}
                  {(Number(!!hasSciraKey) + Number(!!hasExaKey) + Number(!!hasTavilyKey) >= 2) && (
                      <button 
                          onClick={() => setIsSearchMenuOpen(!isSearchMenuOpen)}
                          className="text-[var(--text-dim)] hover:text-[var(--text-main)] p-0.5 rounded transition-colors"
                      >
                          <ChevronDown className="w-3 h-3" />
                      </button>
                  )}

                  {isSearchMenuOpen && (
                      <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsSearchMenuOpen(false)} />
                          <div className="absolute bottom-full left-0 mb-2 w-32 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-xl py-1 z-50 animate-in zoom-in-95 origin-bottom-left">
                              {hasSciraKey && (
                                <div onClick={() => { onUpdateSearchProvider('scira'); setIsSearchMenuOpen(false); }} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${searchProvider === 'scira' ? 'bg-[var(--bg-elevated)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'}`}>
                                    <Globe className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold">Scira</span>
                                </div>
                              )}
                              {hasExaKey && (
                                <div onClick={() => { onUpdateSearchProvider('exa'); setIsSearchMenuOpen(false); }} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${searchProvider === 'exa' ? 'bg-[var(--bg-elevated)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'}`}>
                                    <Globe className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold">Exa</span>
                                </div>
                              )}
                              {hasTavilyKey && (
                                <div onClick={() => { onUpdateSearchProvider('tavily'); setIsSearchMenuOpen(false); }} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${searchProvider === 'tavily' ? 'bg-[var(--bg-elevated)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'}`}>
                                    <Globe className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold">Tavily</span>
                                </div>
                              )}
                          </div>
                      </>
                  )}
              </div>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="relative">
                  <button 
                      id="tour-model-selector"
                      onClick={() => currentMode === 'council' ? setIsCouncilPickerOpen(true) : setIsModelMenuOpen(!isModelMenuOpen)}
                      className={`text-[12px] font-medium flex items-center gap-1.5 transition-all hover:text-[var(--text-main)] ${!isCurrentModelValid ? 'text-red-400' : 'text-[var(--text-dim)]'}`}
                  >
                      <span className="max-w-[150px] truncate">{getModelNameDisplay()}</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                  {/* Model Dropdown Logic */}
                  {currentMode === 'council' ? (
                      isCouncilPickerOpen && (
                          <>
                              <div className="fixed inset-0 z-[100]" onClick={() => setIsCouncilPickerOpen(false)} />
                              <div className="absolute bottom-full right-0 mb-3 w-64 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl p-4 z-[110] animate-in fade-in zoom-in-95 origin-bottom-right">
                                  <h4 className="text-[10px] font-black uppercase text-[var(--text-dim)] mb-3 tracking-widest px-1">Select 3 Models</h4>
                                  <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                                      {visibleModels.length === 0 && <div className="text-[11px] text-[var(--text-dim)] text-center py-2">No models enabled in settings.</div>}
                                      {visibleModels.map(mId => (
                                          <div key={mId} onClick={() => toggleCouncilModel(mId)} className="flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-secondary)] rounded-xl cursor-pointer group transition-colors">
                                              <span className={`text-[12px] font-bold truncate max-w-[160px] ${validCouncilModels.includes(mId) ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{MODEL_FRIENDLY_NAMES[mId] || mId.split('/').pop()?.split(':')[0]}</span>
                                              {validCouncilModels.includes(mId) && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
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
                      <ModelSelector isOpen={isModelMenuOpen} onClose={() => setIsModelMenuOpen(false)} currentModel={currentModel} onSelect={onSelectModel} visibleModels={visibleModels} agents={agents} hasOpenRouterKey={hasOpenRouterKey} hasRoutewayKey={hasRoutewayKey} hasSciraKey={hasSciraKey} onOpenSettings={onOpenSettings} />
                  )}
              </div>
              
              <button 
                  onClick={handleSend} 
                  disabled={(!localText.trim() && attachments.length === 0 && !isLoading) || !isCurrentModelValid}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${((!localText.trim() && attachments.length === 0 && !isLoading) || !isCurrentModelValid) ? 'bg-[#333] text-[#666] opacity-50' : 'bg-white text-black hover:scale-105 shadow-lg active:scale-95'}`}
              >
                  {isLoading ? <div className="w-2.5 h-2.5 bg-current rounded-[1px] animate-pulse" /> : (isEditing ? <Check className="w-4 h-4" strokeWidth={3} /> : <ArrowUp className="w-4 h-4" strokeWidth={2.5} />)}
              </button>
          </div>
      </div>
    </div>
  );
};
