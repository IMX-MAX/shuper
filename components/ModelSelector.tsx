import React from 'react';
import { Check, Bot, Sparkles, Network, Moon, Hexagon } from 'lucide-react';
import { Agent, OPENROUTER_FREE_MODELS, DEEPSEEK_MODELS, MOONSHOT_MODELS, GEMINI_MODELS } from '../types';

interface ModelSelectorProps {
  currentModel: string;
  onSelect: (model: string) => void;
  onClose: () => void;
  isOpen: boolean;
  visibleModels: string[]; // List of ALL visible model IDs across providers
  agents: Agent[];
  hasOpenRouterKey?: boolean;
  hasDeepSeekKey?: boolean;
  hasMoonshotKey?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
    currentModel, 
    onSelect, 
    onClose, 
    isOpen, 
    visibleModels,
    agents,
    hasOpenRouterKey,
    hasDeepSeekKey,
    hasMoonshotKey
}) => {
  if (!isOpen) return null;

  const visibleGemini = GEMINI_MODELS.filter(m => visibleModels.includes(m));
  const visibleOpenRouter = OPENROUTER_FREE_MODELS.filter(m => visibleModels.includes(m));
  const visibleDeepSeek = DEEPSEEK_MODELS.filter(m => visibleModels.includes(m));
  const visibleMoonshot = MOONSHOT_MODELS.filter(m => visibleModels.includes(m));

  return (
    <>
      <div className="fixed inset-0 z-[40]" onClick={onClose} />
      <div className="absolute bottom-full right-0 mb-2 z-[50] w-[320px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
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
                            {model}
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
                            {model.split(':')[0]}
                        </span>
                      </div>
                      {model === currentModel && <Check className="w-3.5 h-3.5 text-[var(--text-main)] flex-shrink-0" />}
                    </div>
                  ))}
              </>
          )}

          {/* DeepSeek Models */}
          {hasDeepSeekKey && visibleDeepSeek.length > 0 && (
              <>
                  <div className="my-1 h-[1px] bg-[var(--border)]" />
                  <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-dim)] tracking-wider bg-[var(--bg-secondary)] sticky top-0">DeepSeek</div>
                  {visibleDeepSeek.map((model) => (
                    <div
                      key={model}
                      onClick={() => {
                        onSelect(model);
                        onClose();
                      }}
                      className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-elevated)] group"
                    >
                      <div className="flex items-center gap-2">
                        <Hexagon className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span className={`text-[13px] font-medium ${model === currentModel ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                            {model}
                        </span>
                      </div>
                      {model === currentModel && <Check className="w-3.5 h-3.5 text-[var(--text-main)]" />}
                    </div>
                  ))}
              </>
          )}

          {/* Moonshot Models */}
          {hasMoonshotKey && visibleMoonshot.length > 0 && (
              <>
                  <div className="my-1 h-[1px] bg-[var(--border)]" />
                  <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-dim)] tracking-wider bg-[var(--bg-secondary)] sticky top-0">Moonshot AI</div>
                  {visibleMoonshot.map((model) => (
                    <div
                      key={model}
                      onClick={() => {
                        onSelect(model);
                        onClose();
                      }}
                      className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-elevated)] group"
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span className={`text-[13px] font-medium ${model === currentModel ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                            {model}
                        </span>
                      </div>
                      {model === currentModel && <Check className="w-3.5 h-3.5 text-[var(--text-main)]" />}
                    </div>
                  ))}
              </>
          )}

        </div>
      </div>
    </>
  );
};