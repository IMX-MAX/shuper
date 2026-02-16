import React, { useState, useRef } from 'react';
import { Agent, GEMINI_MODELS, OPENROUTER_FREE_MODELS, DEEPSEEK_MODELS, MOONSHOT_MODELS } from '../types';
import { Plus, Bot, ChevronRight, Save, Trash2, Edit2, Copy, ChevronDown, ArrowRight, History, Camera, Image as ImageIcon, X, Sparkles, Network, Hexagon, Moon } from 'lucide-react';

interface AgentsViewProps {
  agents: Agent[];
  onCreateAgent: (agent: Agent) => void;
  onDeleteAgent: (id: string) => void;
  onUpdateAgent: (agent: Agent) => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({ agents, onCreateAgent, onDeleteAgent, onUpdateAgent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentContextMenu, setAgentContextMenu] = useState<{ x: number, y: number, agentId: string } | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [baseModel, setBaseModel] = useState('gemini-3-flash-preview');
  const [instructions, setInstructions] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setInstructions('');
    setBaseModel('gemini-3-flash-preview');
    setIcon(undefined);
    setIsEditing(false);
    setEditingAgent(null);
  };

  const handleCreateOrUpdate = () => {
      if (instructions.trim()) {
          const finalName = name.trim() || (editingAgent ? editingAgent.name : "New agent");
          if (editingAgent) {
              onUpdateAgent({
                  ...editingAgent,
                  name: finalName,
                  baseModel,
                  systemInstruction: instructions.trim(),
                  icon
              });
          } else {
              onCreateAgent({
                  id: Date.now().toString(),
                  name: finalName,
                  baseModel,
                  systemInstruction: instructions.trim(),
                  icon
              });
          }
          resetForm();
      }
  };

  const handleEdit = (agent: Agent) => {
      setEditingAgent(agent);
      setName(agent.name);
      setBaseModel(agent.baseModel);
      setInstructions(agent.systemInstruction);
      setIcon(agent.icon);
      setIsEditing(true);
      setAgentContextMenu(null);
  };

  const handleAgentContextMenu = (e: React.MouseEvent, agentId: string) => {
      e.preventDefault();
      setAgentContextMenu({ x: e.clientX, y: e.clientY, agentId });
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => { 
          if (re.target?.result) setIcon(re.target.result as string); 
          e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const getModelLabel = (m: string) => {
      if (m.includes('/')) return m.split('/')[1].split(':')[0];
      return m;
  };

  return (
    <div className="flex-1 h-full bg-[var(--bg-primary)] text-[var(--text-main)] font-inter select-none overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-8 border-b border-[var(--border)] shrink-0 bg-[var(--bg-primary)]/80 backdrop-blur-md z-10">
          <h1 className="text-xl font-bold tracking-tight">Intelligence Factory</h1>
          {isEditing && (
              <button 
                onClick={resetForm}
                className="text-xs font-bold text-[var(--text-dim)] hover:text-[var(--text-main)] uppercase tracking-wider"
              >
                  Close Editor
              </button>
          )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {isEditing ? (
              <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                  <div className="mb-8 flex items-center gap-6">
                      <div className="relative group/icon flex-shrink-0">
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 rounded-[24px] bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center cursor-pointer overflow-hidden transition-all group-hover/icon:border-[var(--text-muted)] shadow-lg"
                          >
                              {icon ? (
                                <img src={icon} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <Bot className="w-8 h-8 text-[var(--text-dim)]" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/icon:opacity-100 flex items-center justify-center transition-opacity">
                                  <Camera className="w-6 h-6 text-white" />
                              </div>
                          </div>
                          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
                      </div>
                      
                      <div className="flex-1">
                          <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-1.5 block">Agent Identity</label>
                          <input 
                             type="text"
                             value={name}
                             onChange={(e) => setName(e.target.value)}
                             placeholder="Name your agent..."
                             className="text-3xl font-bold bg-transparent border-none outline-none text-[var(--text-main)] tracking-tight w-full placeholder:text-[var(--text-dim)] focus:ring-0 px-0"
                             autoFocus
                          />
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="relative bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[24px] overflow-visible shadow-sm">
                          <div className="absolute top-4 left-6 text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest pointer-events-none">System Prompt</div>
                          <textarea 
                             value={instructions}
                             onChange={(e) => {
                               setInstructions(e.target.value);
                               e.target.style.height = 'auto';
                               e.target.style.height = Math.max(140, e.target.scrollHeight) + 'px';
                             }}
                             placeholder="Define the agent's personality, skills, and constraints..."
                             className="w-full min-h-[140px] bg-transparent pt-10 px-6 pb-20 text-[16px] text-[var(--text-main)] placeholder-[var(--text-dim)]/60 focus:outline-none resize-none leading-relaxed font-medium"
                          />
                          
                          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg-tertiary)]/50 backdrop-blur-sm rounded-b-[24px]">
                              <div className="relative">
                                  <button 
                                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                                    className="flex items-center gap-2 text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors py-2 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] uppercase tracking-wide"
                                  >
                                      <span>{getModelLabel(baseModel)}</span>
                                      <ChevronDown className="w-3 h-3 opacity-50" />
                                  </button>
                                  
                                  {isModelMenuOpen && (
                                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 overflow-y-auto max-h-[300px] custom-scrollbar">
                                          <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider sticky top-0 bg-[var(--bg-elevated)]">Gemini</div>
                                          {GEMINI_MODELS.map(m => (
                                              <div key={m} onClick={() => { setBaseModel(m); setIsModelMenuOpen(false); }} className="px-4 py-2 hover:bg-[var(--bg-secondary)] text-[12px] cursor-pointer">{m}</div>
                                          ))}
                                          <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider sticky top-0 bg-[var(--bg-elevated)] mt-2">OpenRouter</div>
                                          {OPENROUTER_FREE_MODELS.map(m => (
                                              <div key={m} onClick={() => { setBaseModel(m); setIsModelMenuOpen(false); }} className="px-4 py-2 hover:bg-[var(--bg-secondary)] text-[12px] cursor-pointer truncate">{getModelLabel(m)}</div>
                                          ))}
                                      </div>
                                  )}
                              </div>

                              <button 
                                 onClick={handleCreateOrUpdate}
                                 disabled={!instructions.trim()}
                                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-[13px] transition-all ${instructions.trim() ? 'bg-[var(--text-main)] text-[var(--bg-primary)] hover:opacity-90 active:scale-95 shadow-lg' : 'bg-[var(--bg-elevated)] text-[var(--text-dim)] cursor-not-allowed'}`}
                              >
                                  <span>{editingAgent ? 'Update Agent' : 'Create Agent'}</span>
                                  <ArrowRight className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {/* Create New Card */}
                      <div 
                        onClick={() => { resetForm(); setIsEditing(true); }}
                        className="group relative aspect-[4/3] bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--text-dim)] rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[var(--bg-elevated)]/50 border-dashed"
                      >
                          <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                              <Plus className="w-6 h-6 text-[var(--text-muted)]" />
                          </div>
                          <span className="font-bold text-[var(--text-main)] text-sm">Create New Agent</span>
                      </div>

                      {/* Agent Cards */}
                      {agents.map(agent => (
                          <div 
                            key={agent.id}
                            onClick={() => handleEdit(agent)}
                            onContextMenu={(e) => handleAgentContextMenu(e, agent.id)}
                            className="group relative aspect-[4/3] bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-[var(--text-dim)] rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
                          >
                              <div className="flex justify-between items-start">
                                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] overflow-hidden">
                                      {agent.icon ? (
                                          <img src={agent.icon} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center"><Bot className="w-6 h-6 text-[var(--text-dim)]" /></div>
                                      )}
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => { e.stopPropagation(); onDeleteAgent(agent.id); }} className="p-2 hover:bg-red-500/10 text-[var(--text-dim)] hover:text-red-500 rounded-xl transition-colors">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                              
                              <div>
                                  <h3 className="font-bold text-[15px] text-[var(--text-main)] mb-1 truncate">{agent.name}</h3>
                                  <p className="text-[11px] font-medium text-[var(--text-dim)] uppercase tracking-wider">{getModelLabel(agent.baseModel)}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {agentContextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setAgentContextMenu(null)} />
            <div 
                className="fixed z-[110] w-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl py-1.5 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-top-left backdrop-blur-md"
                style={{ top: agentContextMenu.y, left: agentContextMenu.x }}
            >
                <div onClick={() => {
                        const agent = agents.find(a => a.id === agentContextMenu.agentId);
                        if (agent) handleEdit(agent);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-secondary)] cursor-pointer"
                >
                    <Edit2 className="w-4 h-4" /> Edit
                </div>
                <div onClick={() => {
                        const agent = agents.find(a => a.id === agentContextMenu.agentId);
                        if (agent) onCreateAgent({...agent, id: Date.now().toString(), name: agent.name + ' (Copy)'});
                        setAgentContextMenu(null);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-secondary)] cursor-pointer"
                >
                    <Copy className="w-4 h-4" /> Duplicate
                </div>
                <div onClick={() => { onDeleteAgent(agentContextMenu.agentId); setAgentContextMenu(null); }} className="flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 text-red-400 cursor-pointer">
                    <Trash2 className="w-4 h-4" /> Delete
                </div>
            </div>
          </>
      )}
    </div>
  );
};