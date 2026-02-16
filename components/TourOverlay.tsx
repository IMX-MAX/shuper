import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, X, Rocket, Zap, Sparkles, Settings, MessageSquare, Target, PlusCircle, ListTodo, Key, Cpu } from 'lucide-react';

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetId: '', 
    title: 'Ready to start?',
    description: "Welcome! I'm here to help you get things done. Let me show you how to use this space.",
    icon: Rocket
  },
  {
    id: 'new-chat',
    targetId: 'tour-new-chat',
    title: 'Starting fresh',
    description: 'You can start a new conversation whenever you want. Everything stays organized here.',
    icon: PlusCircle
  },
  {
    id: 'mode',
    targetId: 'tour-input-area', 
    title: 'Operation Modes',
    description: 'Explore mode is great for talking. Execute mode is better when you need a plan for a project.',
    icon: Target
  },
  {
    id: 'models',
    targetId: 'tour-model-selector',
    title: 'Pick your Brain',
    description: 'Switch between different AI models or your custom agents here. Each one has unique strengths.',
    icon: Cpu
  },
  {
    id: 'settings',
    targetId: 'tour-settings',
    title: 'Connecting AI',
    description: "To start talking, add your API keys in the settings. It only takes a second.",
    icon: Key
  }
];

interface TourOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
  onNewSession?: () => void;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({ onComplete, onSkip, onNewSession }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  useEffect(() => {
    // Ensure the app is in a state where elements exist
    // Only call onNewSession if we actually need a session for the tour step and don't have one
    if ((currentStep.id === 'mode' || currentStep.id === 'models') && onNewSession) {
        const hasSessions = document.querySelector('[data-session-id]');
        if (!hasSessions) {
            onNewSession();
        }
    }
  }, [currentStepIndex, onNewSession, currentStep.id]);

  useEffect(() => {
    const updateHighlight = () => {
      if (!currentStep.targetId) {
        setHighlightRect(null);
        return;
      }
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        setHighlightRect(el.getBoundingClientRect());
      }
    };

    const timer = setInterval(updateHighlight, 100);
    window.addEventListener('resize', updateHighlight);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', updateHighlight);
    };
  }, [currentStepIndex, currentStep.targetId]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const spotlightStyle = useMemo(() => {
    if (!highlightRect) return { display: 'none' };
    const padding = 12;
    return {
      top: highlightRect.top - padding,
      left: highlightRect.left - padding,
      width: highlightRect.width + padding * 2,
      height: highlightRect.height + padding * 2,
    };
  }, [highlightRect]);

  const cardPosition = useMemo(() => {
    if (!highlightRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const margin = 24;
    const cardWidth = 320;
    const cardHeight = 220; 
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let top = highlightRect.bottom + margin;
    let left = highlightRect.left + highlightRect.width / 2;

    // Reposition above if too close to bottom
    if (top + cardHeight > screenHeight - margin) {
      top = highlightRect.top - cardHeight - margin;
    }

    // Keep card on screen horizontally
    const halfWidth = cardWidth / 2;
    if (left - halfWidth < margin) {
      left = halfWidth + margin;
    } else if (left + halfWidth > screenWidth - margin) {
      left = screenWidth - halfWidth - margin;
    }

    return { 
        top: `${Math.max(margin, top)}px`, 
        left: `${left}px`, 
        transform: 'translateX(-50%)',
    };
  }, [highlightRect]);

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden pointer-events-auto">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-all duration-500"
        style={{
          clipPath: highlightRect 
            ? `polygon(0% 0%, 0% 100%, ${highlightRect.left - 12}px 100%, ${highlightRect.left - 12}px ${highlightRect.top - 12}px, ${highlightRect.right + 12}px ${highlightRect.top - 12}px, ${highlightRect.right + 12}px ${highlightRect.bottom + 12}px, ${highlightRect.left - 12}px ${highlightRect.bottom + 12}px, ${highlightRect.left - 12}px 100%, 100% 100%, 100% 0%)`
            : 'none'
        }}
      />

      {highlightRect && (
        <div 
          className="absolute border-2 border-white/40 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.15)] transition-all duration-500 pointer-events-none"
          style={spotlightStyle}
        />
      )}

      <div 
        className="absolute w-[320px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95"
        style={cardPosition}
      >
        <button 
          onClick={onSkip}
          className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            {React.createElement(currentStep.icon, { className: "w-5 h-5 text-white" })}
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{currentStep.title}</h3>
            <p className="text-[10px] text-[var(--text-dim)] uppercase font-bold">{currentStepIndex + 1} of {TOUR_STEPS.length}</p>
          </div>
        </div>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
          {currentStep.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <button onClick={onSkip} className="text-xs font-bold text-[var(--text-dim)] hover:text-white uppercase">Skip</button>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
                <button onClick={handleBack} className="p-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-white transition-colors hover:bg-[var(--border)]"><ChevronLeft className="w-4 h-4" /></button>
            )}
            <button 
              onClick={handleNext}
              className="px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:opacity-90 flex items-center gap-2 text-sm transition-all active:scale-95"
            >
              {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};