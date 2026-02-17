
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, X, Rocket, Zap, Sparkles, Settings, MessageSquare, Target, PlusCircle, ListTodo, Key, Cpu, Globe } from 'lucide-react';

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
    id: 'search',
    targetId: 'tour-web-search',
    title: 'Web Search',
    description: 'Enable real-time web access. Toggle search on/off and switch between providers like Scira, Exa, or Tavily.',
    icon: Globe
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
    if ((currentStep.id === 'mode' || currentStep.id === 'models' || currentStep.id === 'search') && onNewSession) {
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
    updateHighlight();
    
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
    const padding = 8;
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

    const margin = 20;
    const cardWidth = 340; // Updated width to match new design
    const cardHeight = 240; 
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let top = highlightRect.bottom + margin;
    let left = highlightRect.left + highlightRect.width / 2;

    // Reposition above if too close to bottom
    if (top + cardHeight > screenHeight - margin) {
      top = highlightRect.top - cardHeight - margin;
    }
    
    // Safety check for top edge
    if (top < margin) top = margin;

    // Keep card on screen horizontally
    const halfWidth = cardWidth / 2;
    if (left - halfWidth < margin) {
      left = halfWidth + margin;
    } else if (left + halfWidth > screenWidth - margin) {
      left = screenWidth - halfWidth - margin;
    }

    return { 
        top: `${top}px`, 
        left: `${left}px`, 
        transform: 'translateX(-50%)',
    };
  }, [highlightRect]);

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden pointer-events-auto font-inter">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-500"
        style={{
          clipPath: highlightRect 
            ? `polygon(0% 0%, 0% 100%, ${highlightRect.left - 8}px 100%, ${highlightRect.left - 8}px ${highlightRect.top - 8}px, ${highlightRect.right + 8}px ${highlightRect.top - 8}px, ${highlightRect.right + 8}px ${highlightRect.bottom + 8}px, ${highlightRect.left - 8}px ${highlightRect.bottom + 8}px, ${highlightRect.left - 8}px 100%, 100% 100%, 100% 0%)`
            : 'none'
        }}
      />

      {highlightRect && (
        <div 
          className="absolute border-2 border-white/20 rounded-2xl shadow-[0_0_0_4px_rgba(255,255,255,0.05)] transition-all duration-300 pointer-events-none"
          style={spotlightStyle}
        />
      )}

      {/* Positioning Container */}
      <div 
        className="absolute w-[340px] max-w-[calc(100vw-32px)] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={cardPosition}
      >
        {/* Animated Card Content */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl shadow-2xl p-6 animate-fly-in-up">
            <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1E1E1E] border border-[#333] flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                {React.createElement(currentStep.icon, { className: "w-5 h-5" })}
            </div>
            <div className="pt-0.5">
                <h3 className="font-bold text-white text-[16px] leading-tight mb-1">{currentStep.title}</h3>
                <p className="text-[10px] font-bold text-[#525252] tracking-[0.15em] uppercase">{currentStepIndex + 1} OF {TOUR_STEPS.length}</p>
            </div>
            </div>

            <p className="text-[13px] text-[#A1A1A1] leading-relaxed mb-8 font-medium">
            {currentStep.description}
            </p>

            <div className="flex items-center justify-between">
            <button 
                onClick={onSkip} 
                className="text-[11px] font-bold text-[#525252] hover:text-[#A1A1A1] uppercase tracking-wider transition-colors py-2"
            >
                Skip
            </button>
            
            <div className="flex items-center gap-3">
                {currentStepIndex > 0 && (
                    <button 
                        onClick={handleBack} 
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2A2A2A] text-[#737373] hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
                
                <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg text-[11px] font-bold uppercase tracking-wide hover:bg-[#E5E5E5] transition-all active:scale-95 shadow-lg"
                >
                <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight className="w-3 h-3" strokeWidth={3} />
                </button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};
