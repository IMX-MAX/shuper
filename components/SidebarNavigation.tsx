import React, { useState } from 'react';
import { 
  SquarePen, 
  Inbox, 
  Flag, 
  CheckCircle2, 
  Tag, 
  Archive, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  Cpu,
  X,
  ChevronDown,
  Sparkles,
  // Added missing Bot icon import
  Bot
} from 'lucide-react';
import { STATUS_CONFIG } from './StatusSelector';
import { SessionStatus, Label } from '../types';

interface SidebarNavigationProps {
    currentFilter: string;
    onSetFilter: (filter: string) => void;
    onNewSession: () => void;
    onBack?: () => void;
    onForward?: () => void;
    canBack: boolean;
    canForward: boolean;
    statusCounts: Record<SessionStatus, number>;
    availableLabels: Label[];
    currentView: 'chat' | 'agents' | 'settings';
    onChangeView: (view: 'chat' | 'agents' | 'settings') => void;
    workspaceName: string;
    workspaceIcon?: string;
    onShowWhatsNew: () => void;
    onCloseMobile?: () => void;
    onLogoClick?: () => void;
    isLogoGlowing?: boolean;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ 
    currentFilter, 
    onSetFilter, 
    onNewSession,
    onBack,
    onForward,
    canBack,
    canForward,
    statusCounts,
    availableLabels,
    currentView,
    onChangeView,
    workspaceName,
    workspaceIcon,
    onShowWhatsNew,
    onCloseMobile,
    onLogoClick,
    isLogoGlowing
}) => {
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(false);

  return (
    <div className="w-[260px] flex-shrink-0 bg-[var(--bg-primary)] flex flex-col h-full text-[var(--text-muted)] text-[14px] z-20 transition-all duration-300">
      <div className="h-14 flex items-center px-4 justify-between">
        <div 
            className={`flex items-center gap-2 cursor-pointer transition-all select-none group ${isLogoGlowing ? 'logo-glow' : ''}`} 
            onClick={() => {
                onChangeView('chat');
                if (onLogoClick) onLogoClick();
            }}
        >
            <span className="font-bold text-[var(--text-main)] text-[15px] tracking-tight">Shuper</span>
        </div>
        <div className="flex gap-0.5 items-center">
          <button 
            disabled={!canBack}
            onClick={onBack}
            className={`p-1 rounded hover:bg-[var(--bg-elevated)] transition-all ${canBack ? 'text-[var(--text-dim)] hover:text-white' : 'text-[var(--text-dim)] opacity-30'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
             disabled={!canForward}
             onClick={onForward}
             className={`p-1 rounded hover:bg-[var(--bg-elevated)] transition-all ${canForward ? 'text-[var(--text-dim)] hover:text-white' : 'text-[var(--text-dim)] opacity-30'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-3 pb-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="mb-4">
            <button 
                id="tour-new-chat"
                onClick={onNewSession}
                className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-main)] transition-all duration-200 border border-[var(--border)] bg-transparent active:scale-[0.98]"
            >
              <SquarePen className="w-4 h-4" />
              <span className="font-medium text-[14px]">New Session</span>
            </button>
        </div>

        <div onClick={() => { onChangeView('chat'); onSetFilter('all'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentView === 'chat' && currentFilter === 'all' ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
          <Inbox className="w-4 h-4" />
          <span>All Sessions</span>
        </div>

        <div onClick={() => { onChangeView('chat'); onSetFilter('flagged'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentView === 'chat' && currentFilter === 'flagged' ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
          <Flag className="w-4 h-4" />
          <span>Flagged</span>
        </div>

        <div>
          <div onClick={() => setIsStatusExpanded(!isStatusExpanded)} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>Status</span>
            </div>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isStatusExpanded ? 'rotate-180' : ''}`} />
          </div>
          {isStatusExpanded && (
            <div className="ml-4 border-l border-[var(--border)] space-y-0.5 mt-0.5 mb-1">
              {(Object.keys(STATUS_CONFIG) as SessionStatus[]).filter(s => s !== 'archive').map((status) => (
                <div 
                  key={status} 
                  onClick={() => { onChangeView('chat'); onSetFilter(`status:${status}`); }}
                  className="flex items-center gap-2.5 px-6 py-1.5 rounded-lg text-[13px] text-[var(--text-dim)] hover:text-[var(--text-main)] cursor-pointer transition-colors"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[status].color.replace('text-', 'bg-')}`} />
                  <span>{STATUS_CONFIG[status].label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div onClick={() => setIsLabelsExpanded(!isLabelsExpanded)} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]`}>
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4" />
              <span>Labels</span>
            </div>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isLabelsExpanded ? 'rotate-180' : ''}`} />
          </div>
          {isLabelsExpanded && (
            <div className="ml-4 border-l border-[var(--border)] space-y-0.5 mt-0.5 mb-1">
              {availableLabels.map((label) => (
                <div 
                  key={label.id} 
                  onClick={() => { onChangeView('chat'); onSetFilter(`label:${label.id}`); }}
                  className="flex items-center gap-2.5 px-6 py-1.5 rounded-lg text-[13px] text-[var(--text-dim)] hover:text-[var(--text-main)] cursor-pointer transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                  <span className="truncate">{label.name}</span>
                </div>
              ))}
              {availableLabels.length === 0 && <div className="px-6 py-1.5 text-[12px] text-[var(--text-dim)] italic">No labels</div>}
            </div>
          )}
        </div>

        <div onClick={() => { onChangeView('chat'); onSetFilter('archived'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentView === 'chat' && currentFilter === 'archived' ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
          <Archive className="w-4 h-4" />
          <span>Archived</span>
        </div>

        <div className="my-4 h-[1px] bg-[var(--border)] mx-1" />

        <div onClick={() => onChangeView('agents')} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentView === 'agents' ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
          <Bot className="w-4 h-4" />
          <span>Agents</span>
        </div>
      </div>

      <div className="px-3 pb-4 space-y-1">
        <div id="tour-settings" onClick={() => onChangeView('settings')} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentView === 'settings' ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </div>
        <div onClick={onShowWhatsNew} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-all group">
          <Sparkles className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--text-main)] transition-colors" />
          <span>What's New</span>
        </div>

        <div className="pt-2">
            <div 
              onClick={() => onChangeView('settings')}
              className="flex items-center justify-between px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer rounded-lg hover:bg-[var(--bg-elevated)] transition-all"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {workspaceIcon ? (
                        <img src={workspaceIcon} className="w-5 h-5 rounded-full object-cover border border-neutral-500/20 flex-shrink-0" alt="" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-neutral-500/20 text-neutral-500 flex items-center justify-center text-[10px] font-bold border border-neutral-500/20 flex-shrink-0">
                            {workspaceName.charAt(0).toLowerCase()}
                        </div>
                    )}
                    <span className="truncate lowercase font-medium">{workspaceName}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
                <HelpCircle className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity" />
            </div>
        </div>
      </div>
    </div>
  );
};