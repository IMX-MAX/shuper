import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  Circle, 
  Tag, 
  Flag, 
  Archive, 
  Mail, 
  Edit2, 
  RefreshCcw, 
  Trash2, 
  ChevronRight,
  CheckCircle2,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { SessionStatus, Label } from '../types';
import { STATUS_CONFIG } from './StatusSelector';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string, payload?: any) => void;
  currentStatus: SessionStatus;
  availableLabels: Label[];
  currentLabelIds: string[];
  isFlagged?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  position, 
  onClose, 
  onAction, 
  currentStatus,
  availableLabels,
  currentLabelIds,
  isFlagged
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position if it goes off screen
  const adjustedLeft = Math.min(position.x, window.innerWidth - 220); 
  const adjustedTop = Math.min(position.y, window.innerHeight - 350);

  const style: React.CSSProperties = {
    top: adjustedTop,
    left: adjustedLeft,
    position: 'fixed',
    zIndex: 99999,
  };

  const menuContent = (
    <div 
      ref={menuRef}
      style={style}
      className="w-52 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl py-1.5 text-[13px] text-[var(--text-muted)] animate-in fade-in zoom-in-95 duration-100 origin-top-left backdrop-blur-md"
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="px-1.5 space-y-0.5">
        <div 
            onClick={(e) => {
                e.stopPropagation();
                onAction('new_session');
                onClose();
            }}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--accent)] hover:text-[var(--bg-primary)] rounded-lg cursor-pointer transition-all text-[var(--text-main)] group/new"
        >
           <PlusCircle className="w-4 h-4 text-[var(--accent)] group-hover/new:text-[var(--bg-primary)]" />
           <span className="font-bold">New Session</span>
           <Sparkles className="w-3 h-3 ml-auto opacity-0 group-hover/new:opacity-100 transition-opacity" />
        </div>
        <div className="h-[1px] bg-[var(--border)] my-1 mx-2" />
        
        {/* Status Submenu Trigger */}
        <div 
           className="relative flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] rounded-lg cursor-pointer group transition-colors"
           onMouseEnter={() => setActiveSubmenu('status')}
        >
           <div className="flex items-center gap-3">
             <Circle className="w-4 h-4" />
             <span>Status</span>
           </div>
           <ChevronRight className="w-3.5 h-3.5" />

           {activeSubmenu === 'status' && (
               <div 
                  className="absolute left-full top-[-6px] ml-1 w-44 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl py-1 animate-in fade-in slide-in-from-left-1 duration-100 z-[110]"
                  onMouseLeave={() => setActiveSubmenu(null)}
               >
                   {(Object.entries(STATUS_CONFIG) as [SessionStatus, any][]).map(([key, cfg]) => (
                       <div 
                          key={key}
                          onClick={(e) => {
                              e.stopPropagation();
                              onAction('update_status', key);
                              onClose();
                          }}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] cursor-pointer mx-1 rounded-lg transition-colors"
                       >
                           <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                           <span>{cfg.label}</span>
                           {key === currentStatus && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-[var(--text-main)]" />}
                       </div>
                   ))}
               </div>
           )}
        </div>

        {/* Labels Submenu Trigger */}
        <div 
           className="relative flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] rounded-lg cursor-pointer group transition-colors"
           onMouseEnter={() => setActiveSubmenu('labels')}
        >
           <div className="flex items-center gap-3">
             <Tag className="w-4 h-4" />
             <span>Labels</span>
           </div>
           <ChevronRight className="w-3.5 h-3.5" />

           {activeSubmenu === 'labels' && (
               <div 
                  className="absolute left-full top-0 ml-1 w-44 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl py-1 animate-in fade-in slide-in-from-left-1 duration-100 z-[110]"
                  onMouseLeave={() => setActiveSubmenu(null)}
               >
                   {availableLabels.length === 0 ? (
                       <div className="px-3 py-2 text-[var(--text-dim)] italic">No labels</div>
                   ) : (
                       availableLabels.map(label => {
                           const isSelected = currentLabelIds.includes(label.id);
                           return (
                               <div 
                                  key={label.id}
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      onAction('toggle_label', label.id);
                                  }}
                                  className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] cursor-pointer mx-1 rounded-lg transition-colors"
                               >
                                   <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }}></div>
                                   <span className="truncate">{label.name}</span>
                                   {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-[var(--text-main)]" />}
                               </div>
                           )
                       })
                   )}
               </div>
           )}
        </div>

        <div 
           onClick={(e) => {
               e.stopPropagation();
               onAction('toggle_flag'); 
               onClose();
           }}
           className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition-colors"
        >
           <Flag className={`w-4 h-4 ${isFlagged ? 'text-red-400 fill-red-400' : ''}`} />
           <span>{isFlagged ? 'Unflag' : 'Flag'}</span>
        </div>
         <div 
            onClick={(e) => {
                e.stopPropagation();
                onAction('toggle_archive');
                onClose();
            }}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition-colors"
         >
           <Archive className="w-4 h-4" />
           <span>{currentStatus === 'archive' ? 'Unarchive' : 'Archive'}</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition-colors">
           <Mail className="w-4 h-4" />
           <span>Mark as Unread</span>
        </div>
      </div>
      
      <div className="h-[1px] bg-[var(--border)] my-1 mx-2" />
      
      <div className="px-1.5 space-y-0.5">
        <div 
            onClick={(e) => {
                e.stopPropagation();
                onAction('rename');
                onClose();
            }}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition-colors"
        >
           <Edit2 className="w-4 h-4" />
           <span>Rename</span>
        </div>
        <div 
            onClick={(e) => {
                e.stopPropagation();
                onAction('regenerate_title');
                onClose();
            }}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition-colors"
        >
           <RefreshCcw className="w-4 h-4" />
           <span>Regenerate Title</span>
        </div>
      </div>
      
      <div className="h-[1px] bg-[var(--border)] my-1 mx-2" />
      
      <div className="px-1.5">
        <div 
            onClick={(e) => {
                e.stopPropagation();
                onAction('delete');
                onClose();
            }}
            className="flex items-center gap-3 px-3 py-2 hover:bg-red-500/20 hover:text-red-400 text-red-400/80 rounded-lg cursor-pointer transition-all"
        >
           <Trash2 className="w-4 h-4" />
           <span>Delete</span>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};