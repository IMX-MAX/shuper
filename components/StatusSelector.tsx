import React from 'react';
import ReactDOM from 'react-dom';
import { 
  CircleDashed, 
  Circle, 
  CheckCircle2, 
  XCircle, 
  Archive, 
  CircleDot
} from 'lucide-react';
import { SessionStatus } from '../types';

interface StatusSelectorProps {
  currentStatus: SessionStatus;
  onSelect: (status: SessionStatus) => void;
  onClose: () => void;
  isOpen: boolean;
  position?: React.CSSProperties; 
}

export const STATUS_CONFIG: Record<SessionStatus, { label: string; icon: React.ElementType; color: string }> = {
  backlog: { label: 'Backlog', icon: CircleDashed, color: 'text-[#737373]' },
  todo: { label: 'Todo', icon: Circle, color: 'text-[#A1A1A1]' },
  needs_review: { label: 'Needs Review', icon: CircleDot, color: 'text-[#F59E0B]' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-[#10B981]' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-[#737373]' },
  archive: { label: 'Archive', icon: Archive, color: 'text-[#737373]' },
};

export const StatusSelector: React.FC<StatusSelectorProps> = ({ currentStatus, onSelect, onClose, isOpen, position }) => {
  if (!isOpen) return null;

  const statuses: SessionStatus[] = ['backlog', 'todo', 'needs_review', 'done', 'cancelled', 'archive'];
  
  const fixedStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99999, 
    width: '180px',
    backgroundColor: '#1F1F1F',
    border: '1px solid #333',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    paddingTop: '4px',
    paddingBottom: '4px',
    ...position
  };

  const menuContent = (
    <>
      <div className="fixed inset-0 z-[99998]" onClick={onClose} />
      <div 
        className="animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        style={fixedStyle}
      >
        <div className="px-2 py-1.5 border-b border-[#2A2A2A] mb-1">
            <input 
                type="text" 
                placeholder="Filter statuses..." 
                className="w-full bg-transparent text-[13px] text-[#E5E5E5] placeholder-[#525252] focus:outline-none px-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
            />
        </div>
        {statuses.map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const isSelected = currentStatus === status;
          
          return (
            <div
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(status);
                onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                isSelected ? 'bg-[#2A2A2A]' : 'hover:bg-[#2A2A2A]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              <span className={`text-[13px] font-medium ${isSelected ? 'text-[#E5E5E5]' : 'text-[#A1A1A1]'}`}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};