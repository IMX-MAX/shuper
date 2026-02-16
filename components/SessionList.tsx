import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Inbox, X, Flag, Tag, Archive, Menu, Circle, MessageSquareDashed, Loader2 } from 'lucide-react';
import { Session, SessionStatus, Label } from '../types';
import { STATUS_CONFIG, StatusSelector } from './StatusSelector';
import { ContextMenu } from './ContextMenu';

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onUpdateSessionStatus: (id: string, status: SessionStatus) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onRegenerateTitle: (id: string) => void;
  availableLabels: Label[];
  onToggleLabel: (sessionId: string, labelId: string) => void;
  onCreateLabel: (label: Label) => void;
  sessionLoading: Record<string, boolean>;
  onNewSession: () => void;
  onToggleFlag: (sessionId: string) => void;
  currentFilter: string;
  onOpenSidebar?: () => void;
  triggerSearch?: number;
  onEditTitle?: (val: boolean) => void;
}

export const SessionList: React.FC<SessionListProps> = ({ 
    sessions, 
    activeSessionId, 
    onSelectSession, 
    onUpdateSessionStatus,
    onDeleteSession,
    onRenameSession,
    onRegenerateTitle,
    availableLabels,
    onToggleLabel,
    onCreateLabel,
    sessionLoading,
    onNewSession,
    onToggleFlag,
    currentFilter,
    onOpenSidebar,
    triggerSearch,
    onEditTitle
}) => {
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties | undefined>(undefined);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({ opacity: 0 });
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, sessionId: string } | null>(null);

  const filterTitle = useMemo(() => {
    if (currentFilter === 'all') return 'All Sessions';
    if (currentFilter === 'flagged') return 'Flagged';
    if (currentFilter === 'archived') return 'Archived';
    if (currentFilter.startsWith('status:')) {
      const status = currentFilter.split(':')[1] as SessionStatus;
      return STATUS_CONFIG[status]?.label || 'Status';
    }
    if (currentFilter.startsWith('label:')) {
      const labelId = currentFilter.split(':')[1];
      const label = availableLabels.find(l => l.id === labelId);
      return label ? label.name : 'Label';
    }
    return 'Sessions';
  }, [currentFilter, availableLabels]);

  const displayedSessions = sessions.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.subtitle && s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (triggerSearch && triggerSearch > 0) {
      setIsSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [triggerSearch]);

  useEffect(() => {
    const updateIndicator = () => {
        if (activeSessionId && listRef.current) {
            const activeElement = listRef.current.querySelector(`[data-session-id="${activeSessionId}"]`) as HTMLElement;
            const innerBox = activeElement?.querySelector('.session-item-box') as HTMLElement;
            
            if (innerBox && listRef.current) {
                const containerRect = listRef.current.getBoundingClientRect();
                const boxRect = innerBox.getBoundingClientRect();
                const relativeTop = boxRect.top - containerRect.top + listRef.current.scrollTop;
                
                setIndicatorStyle({
                    opacity: 1,
                    transform: `translateY(${relativeTop}px)`,
                    height: `${boxRect.height}px`,
                    width: '3px',
                    left: '0px', 
                    top: '0px',
                    borderRadius: '0px 2px 2px 0px'
                });
            }
        } else {
            setIndicatorStyle({ opacity: 0 });
        }
    };

    // Use requestAnimationFrame for smoother updates during layout changes
    requestAnimationFrame(updateIndicator);
    
    const observer = new ResizeObserver(updateIndicator);
    if (listRef.current) observer.observe(listRef.current);

    window.addEventListener('resize', updateIndicator);
    return () => {
        observer.disconnect();
        window.removeEventListener('resize', updateIndicator);
    };
  }, [activeSessionId, sessions, displayedSessions.length]);

  useEffect(() => {
      if (isSearchOpen && searchInputRef.current) {
          searchInputRef.current.focus();
      }
  }, [isSearchOpen]);

  const handleStatusClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 5, left: rect.left });
    setStatusMenuOpenId(sessionId);
  };

  const handleContextMenu = (e: React.MouseEvent, sessionId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, sessionId });
  };

  const handleHeaderContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, sessionId: 'header' });
  };

  const handleContextAction = (action: string, payload: any, sessionId: string) => {
      if (sessionId === 'header') {
          if (action === 'new_session') {
              onNewSession();
          }
          setContextMenu(null);
          return;
      }

      if (action === 'delete') {
          onDeleteSession(sessionId);
      } else if (action === 'toggle_archive') {
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
              const newStatus = session.status === 'archive' ? 'todo' : 'archive';
              onUpdateSessionStatus(sessionId, newStatus);
          }
      } else if (action === 'rename') {
          // Check if this is the active session
          if (sessionId === activeSessionId && onEditTitle) {
              onEditTitle(true);
          } else {
              const session = sessions.find(s => s.id === sessionId);
              if (session) {
                 const newTitle = window.prompt('Rename conversation:', session.title);
                 if (newTitle !== null && newTitle.trim() !== '') {
                    onRenameSession(sessionId, newTitle.trim());
                 }
              }
          }
      } else if (action === 'regenerate_title') {
          onRegenerateTitle(sessionId);
      } else if (action === 'update_status') {
          onUpdateSessionStatus(sessionId, payload as SessionStatus);
      } else if (action === 'toggle_label') {
          onToggleLabel(sessionId, payload as string);
      } else if (action === 'toggle_flag') {
          onToggleFlag(sessionId);
      } else if (action === 'new_session') {
          onNewSession();
      }
      setContextMenu(null);
  };

  const getContextSession = (id: string) => {
      if (id === 'header') return undefined;
      return sessions.find(s => s.id === id);
  };

  const contextSession = contextMenu ? getContextSession(contextMenu.sessionId) : undefined;

  return (
    <div className="w-full h-full bg-[var(--bg-secondary)] flex flex-col relative z-10 transition-all duration-300">
      <div 
        className="h-14 shrink-0 relative overflow-hidden" 
        onContextMenu={handleHeaderContextMenu}
      >
         <div className={`absolute inset-0 px-4 flex items-center transition-all duration-300 ${isSearchOpen ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
             <div className="flex-1 flex items-center">
                 {onOpenSidebar && (
                     <button onClick={onOpenSidebar} className="md:hidden p-1 rounded hover:bg-[var(--bg-elevated)]">
                         <Menu className="w-5 h-5 text-[var(--text-main)]" />
                     </button>
                 )}
             </div>
             
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="font-bold text-[var(--text-main)] text-[13px] tracking-wide pointer-events-auto select-none">
                    {filterTitle}
                </span>
             </div>

             <div className="flex-1 flex items-center justify-end">
                <Search className="w-4 h-4 text-[var(--text-dim)] cursor-pointer hover:text-[var(--text-main)] transition-colors" onClick={() => setIsSearchOpen(true)} />
             </div>
         </div>

         {/* Search Input Overlay */}
         <div className={`absolute inset-0 px-4 flex items-center gap-2 transition-all duration-300 bg-[var(--bg-secondary)] z-10 ${isSearchOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
             <Search className="w-4 h-4 text-[var(--text-main)]" />
             <input 
                 ref={searchInputRef}
                 className="flex-1 bg-transparent text-sm text-[var(--text-main)] focus:outline-none placeholder-[var(--text-dim)]"
                 placeholder="Search sessions..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onBlur={() => !searchQuery && setIsSearchOpen(false)}
                 onKeyDown={(e) => e.key === 'Escape' && setIsSearchOpen(false)}
             />
             <X className="w-3.5 h-3.5 text-[var(--text-dim)] cursor-pointer hover:text-[var(--text-main)]" onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar relative" ref={listRef}>
        <div 
            className="absolute bg-[var(--accent)] z-20 active-indicator-bar pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={indicatorStyle}
        />
        {displayedSessions.length > 0 && <div className="px-2 mb-2 text-[10px] font-bold text-[var(--text-dim)] tracking-widest uppercase">Latest</div>}
        <div className="space-y-0.5">
            {displayedSessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-60">
                    <MessageSquareDashed className="w-10 h-10 text-[var(--text-dim)]" strokeWidth={1.5} />
                    <div>
                        <div className="text-[13px] font-semibold text-[var(--text-main)]">Empty here</div>
                        <div className="text-[12px] text-[var(--text-dim)]">Create a new session to begin.</div>
                    </div>
                </div>
            ) : (
                displayedSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const isLoading = sessionLoading[session.id] || false;
                    const StatusIcon = STATUS_CONFIG[session.status]?.icon || Circle;
                    const statusColor = isActive ? 'text-white' : (STATUS_CONFIG[session.status]?.color || 'text-[var(--text-dim)]');

                    return (
                        <div 
                            key={session.id} 
                            data-session-id={session.id} 
                            className="relative flex items-stretch animate-slide-in"
                            onContextMenu={(e) => handleContextMenu(e, session.id)}
                        >
                            <div
                                onClick={() => onSelectSession(session.id)}
                                className={`session-item-box group flex-1 flex items-start gap-3 p-3 ml-2 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-[var(--bg-elevated)]' : 'hover:bg-[var(--bg-elevated)]/40'}`}
                            >
                                <div 
                                    className={`mt-1 flex-shrink-0 relative ${isLoading ? 'animate-pulse' : ''}`} 
                                    onClick={(e) => handleStatusClick(e, session.id)}
                                >
                                    {isLoading && <div className="absolute inset-[-4px] bg-[var(--accent)]/20 rounded-full animate-ping opacity-75"></div>}
                                    <StatusIcon className={`w-4 h-4 relative z-10 ${isActive ? 'opacity-100' : 'opacity-60'} ${statusColor} group-hover:opacity-100 transition-opacity`} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <div className="flex-1 min-w-0 pr-1 overflow-hidden">
                                    <div className="flex items-center justify-between min-w-0">
                                        <span className={`text-[14px] font-semibold truncate block max-w-[160px] ${isActive ? 'text-[var(--text-main)]' : (session.status === 'done' ? 'text-[var(--text-dim)] line-through' : 'text-[var(--text-main)]')}`}>
                                            {session.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1 min-w-0">
                                        <div className="flex items-center gap-2 overflow-hidden w-full">
                                            {session.hasNewResponse && !isActive && (
                                                <span className="flex-shrink-0 text-[10px] font-bold bg-[#5865F2] text-white px-2 py-0.5 rounded-md tracking-tight">New</span>
                                            )}
                                            <span className="flex-shrink-0 text-[9px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded tracking-tighter border border-[var(--border)] uppercase truncate">{session.mode || 'Explore'}</span>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {session.labelIds?.map(lid => {
                                                    const label = availableLabels.find(l => l.id === lid);
                                                    return label ? (
                                                        <div key={lid} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                                                    ) : null;
                                                })}
                                            </div>
                                            {session.isFlagged && <Flag className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0 ml-auto" />}
                                            <span className="text-[10px] text-[var(--text-dim)] font-medium flex-shrink-0 ml-auto tabular-nums">now</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
      {statusMenuOpenId && (
        <StatusSelector
            isOpen={true}
            onClose={() => setStatusMenuOpenId(null)}
            currentStatus={sessions.find(s => s.id === statusMenuOpenId)?.status || 'todo'}
            onSelect={(status) => onUpdateSessionStatus(statusMenuOpenId, status)}
            position={menuPosition}
        />
      )}
      {contextMenu && (
          <ContextMenu 
            position={{ x: contextMenu.x, y: contextMenu.y }}
            onClose={() => setContextMenu(null)}
            onAction={(action, payload) => handleContextAction(action, payload, contextMenu.sessionId)}
            currentStatus={contextSession?.status || 'todo'}
            availableLabels={availableLabels}
            currentLabelIds={contextSession?.labelIds || []}
            isFlagged={contextSession?.isFlagged || false}
          />
      )}
    </div>
  );
};