
import React, { useState, useRef, useEffect } from 'react';
import { Agent, GEMINI_MODELS, OPENROUTER_FREE_MODELS, ROUTEWAY_MODELS, MODEL_FRIENDLY_NAMES, AgentTool } from '../types';
import { Plus, Bot, ChevronRight, Save, Trash2, Edit2, Copy, ChevronDown, ArrowRight, ArrowUp, History, Camera, Image as ImageIcon, X, Sparkles, Network, Hexagon, Moon, Link as LinkIcon, Globe, Box, Key, Plug, Folder, Command } from 'lucide-react';

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
  const [description, setDescription] = useState('');
  const [baseModel, setBaseModel] = useState('gemini-3-flash-preview');
  const [instructions, setInstructions] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [tools, setTools] = useState<AgentTool[]>([]);

  // Tool State
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [newToolInput, setNewToolInput] = useState('');
  const [newToolType, setNewToolType] = useState<AgentTool['type']>('mcp');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setInstructions('');
    setBaseModel('gemini-3-flash-preview');
    setIcon(undefined);
    setTools([]);
    setIsEditing(false);
    setEditingAgent(null);
  };

  const handleCreateOrUpdate = () => {
      if (name.trim()) {
          const finalName = name.trim();
          const newAgent: Agent = {
              id: editingAgent ? editingAgent.id : Date.now().toString(),
              name: finalName,
              baseModel,
              systemInstruction: instructions.trim(),
              description: description.trim(),
              icon,
              tools
          };

          if (editingAgent) {
              onUpdateAgent(newAgent);
          } else {
              onCreateAgent(newAgent);
          }
          resetForm();
      }
  };

  const handleEdit = (agent: Agent) => {
      setEditingAgent(agent);
      setName(agent.name);
      setDescription(agent.description || '');
      setBaseModel(agent.baseModel);
      setInstructions(agent.systemInstruction);
      setIcon(agent.icon);
      setTools(agent.tools || []);
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

  const addTool = () => {
      if (newToolInput.trim()) {
          const newTool: AgentTool = {
              id: Date.now().toString(),
              type: newToolType,
              name: newToolType === 'api_linear' ? 'Linear' : newToolType === 'mcp' ? 'MCP Server' : 'Custom API',
              config: newToolInput.trim(),
              active: true
          };
          setTools([...tools, newTool]);
          setNewToolInput('');
          setIsToolMenuOpen(false);
      }
  };

  const removeTool = (id: string) => {
      setTools(tools.filter(t => t.id !== id));
  };

  const getModelLabel = (m: string) => {
      return MODEL_FRIENDLY_NAMES[m] || (m.includes('/') ? m.split('/')[1].split(':')[0] : m);
  };

  return (
    <div className="flex-1 h-full bg-[var(--bg-primary)] text-[var(--text-main)] font-inter select-none overflow-hidden flex flex-col relative">
      
      {/* Editor View */}
      {isEditing ? (
          <div className="flex-1 flex flex-col h-full relative bg-[var(--bg-primary)] animate-in fade-in zoom-in-95 duration-200">
              {/* Top Navigation */}
              <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                  <div 
                    onClick={resetForm}
                    className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text-main)] cursor-pointer transition-colors"
                  >
                      <ChevronDown className="w-5 h-5 rotate-90" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center shadow-sm">
                          {icon ? <img src={icon} className="w-full h-full object-cover" /> : <Bot className="w-5 h-5 text-[var(--text-dim)]" />}
                      </div>
                      <div onClick={() => fileInputRef.current?.click()} className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-tertiary)] border border-[var(--border)] shadow-sm">
                          <Plus className="w-4 h-4 text-[var(--text-dim)]" />
                      </div>
                      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
                  </div>
              </div>

              {/* Center Content */}
              <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-6 -mt-10">
                  <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Agent Name"
                      className="text-4xl md:text-5xl font-bold bg-transparent border-none text-center outline-none text-[var(--text-main)] placeholder-[var(--text-dim)]/50 w-full mb-4 tracking-tight"
                      autoFocus
                  />
                  <input 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Short description or role..."
                      className="text-lg bg-transparent border-none text-center outline-none text-[var(--text-muted)] placeholder-[var(--text-dim)]/50 w-full max-w-lg font-medium"
                  />

                  {/* Connected Tools Pills */}
                  {tools.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-lg">
                          {tools.map(tool => (
                              <div key={tool.id} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full text-xs font-medium text-[var(--text-main)] animate-in fade-in zoom-in-95 shadow-sm">
                                  {tool.type === 'mcp' && <Globe className="w-3 h-3 text-orange-400" />}
                                  {tool.type === 'api_linear' && <Hexagon className="w-3 h-3 text-blue-400" />}
                                  {tool.type === 'api_custom' && <Plug className="w-3 h-3 text-green-400" />}
                                  <span className="truncate max-w-[150px]">{tool.type === 'api_linear' ? 'Linear' : tool.config}</span>
                                  <button onClick={() => removeTool(tool.id)} className="hover:text-red-400 ml-1"><X className="w-3 h-3" /></button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Bottom Input Bar */}
              <div className="w-full max-w-3xl mx-auto px-6 pb-8 md:pb-12 z-20">
                  <div className="relative bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[2rem] p-2 flex flex-col shadow-2xl transition-all hover:border-[var(--text-dim)]">
                      {/* Tool & Attachment Menu */}
                      {isToolMenuOpen && (
                          <div className="absolute bottom-full left-0 mb-3 ml-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2 z-50">
                              <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-3">Connect Integration</div>
                              <div className="space-y-2 mb-3">
                                  <button onClick={() => setNewToolType('mcp')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${newToolType === 'mcp' ? 'bg-[var(--accent)] text-[var(--bg-primary)]' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                                      <Globe className="w-4 h-4" /> MCP Server
                                  </button>
                                  <button onClick={() => setNewToolType('api_linear')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${newToolType === 'api_linear' ? 'bg-[var(--accent)] text-[var(--bg-primary)]' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                                      <Hexagon className="w-4 h-4" /> Linear
                                  </button>
                              </div>
                              <input 
                                  value={newToolInput}
                                  onChange={(e) => setNewToolInput(e.target.value)}
                                  placeholder={newToolType === 'mcp' ? "Server URL..." : "API Key..."}
                                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] mb-3 focus:outline-none"
                              />
                              <button 
                                  onClick={addTool}
                                  disabled={!newToolInput.trim()}
                                  className="w-full py-2 bg-[var(--text-main)] text-[var(--bg-primary)] rounded-lg text-xs font-bold disabled:opacity-50"
                              >
                                  Add Connection
                              </button>
                          </div>
                      )}

                      <textarea 
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder="System instructions & behavior..."
                          className="w-full bg-transparent border-none text-[var(--text-main)] placeholder-[var(--text-dim)] px-4 py-3 min-h-[56px] max-h-[200px] resize-none focus:outline-none text-[15px] font-medium custom-scrollbar"
                          style={{ height: '56px' }}
                          onInput={(e) => {
                              e.currentTarget.style.height = 'auto';
                              e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 200) + 'px';
                          }}
                      />

                      <div className="flex items-center justify-between px-2 pb-1">
                          <button 
                              onClick={() => setIsToolMenuOpen(!isToolMenuOpen)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-main)] transition-colors group"
                              title="Add Tool"
                          >
                              <Plug className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </button>

                          <div className="flex items-center gap-3">
                              <div className="relative">
                                  <button 
                                      onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                                      className="flex items-center gap-2 text-xs font-bold text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors py-1.5 px-3 rounded-lg hover:bg-[var(--bg-tertiary)]"
                                  >
                                      {getModelLabel(baseModel)}
                                      <ChevronDown className="w-3 h-3 opacity-50" />
                                  </button>
                                  {isModelMenuOpen && (
                                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl py-1 z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in zoom-in-95 origin-bottom-right">
                                          {GEMINI_MODELS.map(m => (
                                              <div key={m} onClick={() => { setBaseModel(m); setIsModelMenuOpen(false); }} className="px-3 py-2 hover:bg-[var(--bg-elevated)] text-xs cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] truncate">
                                                  {getModelLabel(m)}
                                              </div>
                                          ))}
                                          <div className="h-[1px] bg-[var(--border)] my-1" />
                                          {ROUTEWAY_MODELS.map(m => (
                                              <div key={m} onClick={() => { setBaseModel(m); setIsModelMenuOpen(false); }} className="px-3 py-2 hover:bg-[var(--bg-elevated)] text-xs cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] truncate">
                                                  {getModelLabel(m)}
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>

                              <button 
                                  onClick={handleCreateOrUpdate}
                                  disabled={!name.trim()}
                                  className="w-8 h-8 rounded-full bg-[var(--text-main)] text-[var(--bg-primary)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg"
                              >
                                  <ArrowUp className="w-5 h-5" strokeWidth={3} />
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      ) : (
          /* List View */
          <>
            <div className="h-16 flex items-center justify-between px-8 border-b border-[var(--border)] shrink-0 bg-[var(--bg-primary)]/80 backdrop-blur-md z-10">
                <h1 className="text-xl font-bold tracking-tight">Intelligence Factory</h1>
                <button 
                    onClick={() => { resetForm(); setIsEditing(true); }}
                    className="flex items-center gap-2 bg-[var(--text-main)] text-[var(--bg-primary)] px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-lg active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Agent</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-5xl mx-auto pb-20">
                    <div className="flex flex-col gap-3">
                        {agents.length === 0 ? (
                            <div className="text-center py-24 border border-dashed border-[var(--border)] rounded-3xl bg-[var(--bg-secondary)]/30">
                                <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <Bot className="w-10 h-10 text-[var(--text-dim)]" />
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">No agents yet</h3>
                                <p className="text-sm text-[var(--text-dim)] max-w-sm mx-auto mb-8">Create specialized agents with unique personalities, models, and tool integrations.</p>
                                <button 
                                    onClick={() => { resetForm(); setIsEditing(true); }}
                                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] hover:text-[var(--text-main)] transition-colors bg-[var(--bg-elevated)] px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--text-dim)]"
                                >
                                    <Plus className="w-4 h-4" /> Create First Agent
                                </button>
                            </div>
                        ) : (
                            agents.map(agent => (
                                <div 
                                    key={agent.id}
                                    onClick={() => handleEdit(agent)}
                                    onContextMenu={(e) => handleAgentContextMenu(e, agent.id)}
                                    className="group relative flex items-center p-4 bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--text-dim)] rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99]"
                                >
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                                            {agent.icon ? (
                                                <img src={agent.icon} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <Bot className="w-7 h-7 text-[var(--text-dim)]" />
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col gap-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-[16px] text-[var(--text-main)] truncate">{agent.name}</h3>
                                                <span className="text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-2 py-0.5 rounded border border-[var(--border)] uppercase tracking-wider truncate max-w-[150px]">
                                                    {getModelLabel(agent.baseModel)}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-[var(--text-dim)] truncate font-medium group-hover:text-[var(--text-muted)] transition-colors">
                                                {agent.description || "No description provided."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pl-6 border-l border-[var(--border)] ml-2">
                                        {/* Tool Badge */}
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${agent.tools && agent.tools.length > 0 ? 'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--bg-elevated)] border-transparent text-[var(--text-dim)]'}`} title={`${agent.tools?.length || 0} tools connected`}>
                                            <Plug className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">{agent.tools?.length || 0}</span>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteAgent(agent.id); }} 
                                                className="p-2 hover:bg-red-500/10 text-[var(--text-dim)] hover:text-red-500 rounded-xl transition-colors"
                                                title="Delete Agent"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <ChevronRight className="w-5 h-5 text-[var(--text-dim)]" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
          </>
      )}

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
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                    <Edit2 className="w-4 h-4" /> Edit
                </div>
                <div onClick={() => {
                        const agent = agents.find(a => a.id === agentContextMenu.agentId);
                        if (agent) onCreateAgent({...agent, id: Date.now().toString(), name: agent.name + ' (Copy)'});
                        setAgentContextMenu(null);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                    <Copy className="w-4 h-4" /> Duplicate
                </div>
                <div className="h-[1px] bg-[var(--border)] my-1" />
                <div onClick={() => { onDeleteAgent(agentContextMenu.agentId); setAgentContextMenu(null); }} className="flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 text-red-400 cursor-pointer">
                    <Trash2 className="w-4 h-4" /> Delete
                </div>
            </div>
          </>
      )}
    </div>
  );
};
