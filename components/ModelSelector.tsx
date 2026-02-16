
import React from 'react';
import { Check, Bot, Sparkles, Network, Moon, Hexagon, Zap, Settings, ChevronRight } from 'lucide-react';
import { Agent, OPENROUTER_FREE_MODELS, GEMINI_MODELS, ROUTEWAY_MODELS, MODEL_FRIENDLY_NAMES } from '../types';

interface ModelSelectorProps {
  currentModel: string;
  onSelect: (model: string) => void;
  onClose: () => void;
  isOpen: boolean;
  visibleModels: string[]; // List of ALL visible model IDs across providers
  agents: Agent[];
  hasOpenRouterKey?: boolean;
  hasRoutewayKey?: boolean;
  onOpenSettings?: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
    currentModel, 
    onSelect, 
    onClose, 
    isOpen, 
    visibleModels,
    agents,
    hasOpenRouterKey,
    hasRoutewayKey,
    onOpenSettings
}) => {
  if (!isOpen) return null;

  const visibleGemini = GEMINI_MODELS.filter(m => visibleModels.includes(m));
  const visibleOpenRouter = OPENROUTER_FREE_MODELS.filter(m => visibleModels.includes(m));
  const visibleRouteway = ROUTEWAY_MODELS.filter(m => visibleModels.includes(m));

  return (
    <>
      <div className="fixed inset-0 z-[40]" onClick={onClose} />
      <div className="absolute bottom-full right-0 mb-2 z-[50] w-[320px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-xl flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-200 origin-bottom-right overflow-hidden">
        {visibleModels.length === 0 ? (
            <div className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mb-3 shadow-lg border border-[var(--border)]">
                    <Settings className="w-6 h-6 text-[var(--text-main)]" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Configuration Needed</h3>
                <p className="text-[11px] text-[var(--text-dim)] mb-4 leading-relaxed font-medium">
                    Add API keys and enable models in settings to start.
                </p>
                <button 
                    onClick={() => {
                        if(onOpenSettings) onOpenSettings();
                        onClose();
                    }}
                    className="px-5 py-2.5 bg-[var(--text-main)] text-[var(--bg-primary)] rounded-xl font-bold text-xs hover:scale-105 transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                    <span>Open Settings</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        ) : (
            <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
            
            {/* Custom Agents Section */}
            {agents.length > 0 && (
                <>
                    <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-dim)] tracking-wider bg-[var(--bg-secondary)] sticky top-0">Agents</div>
                    {agents.map((agent) => (
                        <div
                        key={agent.id}
                        onClick={() => {
                            onSelect(agent.id);
                            onClose();
                        }}
                        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-elevated)] group"
                        >
                            <div className="flex items-center gap-2">
                                <Bot className="w-3.5 h-3.5 text-[#A78BFA]" />
                                <span className={`text-[13px] font-medium ${agent.id === currentModel ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                                    {agent.name}
                                </span>
                            </div>
                            {agent.id === currentModel && <Check className="w-3.5 h-3.5 text-[var(--text-main)]" />}
                        </div>
                    ))}
                    <div className="my-1 h-[1px] bg-[var(--border)]" />
                </>
            )}

            {/* Gemini Models */}
            {visibleGemini.length > 0 && (
                <>
                    <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-dim)] tracking-wider bg-[var(--bg-secondary)] sticky top-0">Google Gemini</div>
                    {visibleGemini.map((model) => (
                        <div
                        key={model}
                        onClick={() => {
                            onSelect(model);
                            onClose();
                        }}
                        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-elevated)] group"
                        >
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                            <span className={`text-[13px] font-medium ${model === currentModel ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                                {MODEL_FRIENDLY_NAMES[model] || model}
                            </span>
                        </div>
                        {model === currentModel && <Check className="w-3.5 h-3.5 text-[var(--text-main)]" />}
                        </div>
                    ))}
                </>
            )}

            {/* Routeway.ai Models */}
            {hasRoutewayKey && visibleRouteway.length > 0 && (
                <>
                    <div className="my-1 h-[1px] bg-[var(--border)]" />
                    <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-dim)] tracking-wider bg-[var(--bg-secondary)] sticky top-0">Routeway.ai</div>
                    {visibleRouteway.map((model) => (
                        <div
                        key={model}
                        onClick={() => {
                            onSelect(model);
                            onClose();
                        }}
                        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-elevated)] group"
                        >
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-orange-400" />
                            <span className={`text-[13px] font-medium ${model === currentModel ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                                {MODEL_FRIENDLY_NAMES[model] || model}
                            </span>
                        </div>
                        {model === currentModel && <Check className="w-3.5 h-3.5 text-[var(--text-main)]" />}
                        </div>
                    ))}
                </>
            )}

            {/* OpenRouter Models */}
            {hasOpenRouterKey && visibleOpenRouter.length > 0 && (
                <>
                    <div className="my-1 h-[1px] bg-[var(--border)]" />
                    <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-dim)] tracking-wider bg-[var(--bg-secondary)] sticky top-0">OpenRouter (Free)</div>
                    {visibleOpenRouter.map((model) => (
                        <div
                        key={model}
                        onClick={() => {
                            onSelect(model);
                            onClose();
                        }}
                        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-elevated)] group"
                        >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Network className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                            <span className={`text-[13px] font-medium truncate ${model === currentModel ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                                {MODEL_FRIENDLY_NAMES[model] || model.split(':')[0]}
                            </span>
                        </div>
                        {model === currentModel && <Check className="w-3.5 h-3.5 text-[var(--text-main)] flex-shrink-0" />}
                        </div>
                    ))}
                </>
            )}

            </div>
        )}
      </div>
    </>
  );
};
