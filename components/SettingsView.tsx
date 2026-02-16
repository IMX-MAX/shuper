
import React, { useState, useRef } from 'react';
import { UserSettings, Label, GEMINI_MODELS, OPENROUTER_FREE_MODELS, ROUTEWAY_MODELS, ColorTheme, FontFamily, Session, Message, Agent } from '../types';
import { 
  Monitor, 
  Palette, 
  Tag, 
  Plus, 
  Check, 
  X,
  Key,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Trash2,
  Briefcase,
  Keyboard,
  AlertTriangle,
  Wrench,
  Zap,
  Image as ImageIcon,
  Camera,
  Shield,
  Search,
  Sun,
  Moon,
  ChevronLeft,
  Circle,
  Settings,
  RefreshCcw,
  User,
  Layout,
  Sparkles,
  Download,
  Upload
} from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  labels: Label[];
  onUpdateLabels: (labels: Label[]) => void;
  onClearData: () => void;
  onRepairWorkspace: () => void;
  sessions: Session[];
  messages: Record<string, Message[]>;
  agents: Agent[];
  sessionModels: Record<string, string>;
  onImportWorkspace: (data: any) => void;
}

const ApiKeyInput = ({ 
    label, 
    value, 
    onChange, 
    placeholder,
    description
}: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void,
    placeholder: string,
    description?: string
}) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">{label}</label>
                {description && <span className="text-[10px] text-[var(--text-main)] font-bold opacity-80">{description}</span>}
            </div>
            <div className="relative flex items-center group">
                <div className="absolute left-3 text-[var(--text-dim)] group-focus-within:text-[var(--text-muted)] transition-colors">
                    <Shield className="w-3.5 h-3.5" />
                </div>
                <input 
                    type={isVisible ? "text" : "password"} 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)} 
                    placeholder={placeholder} 
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-[var(--text-muted)] text-[var(--text-main)] placeholder-[var(--text-dim)] transition-all" 
                />
                <button 
                    onClick={() => setIsVisible(!isVisible)} 
                    className="absolute right-3 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
                >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

const ModelList = ({ title, models, visibleModels, onToggle, disabled }: { title: string, models: string[], visibleModels: string[], onToggle: (model: string) => void, disabled?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    if (disabled) {
        return (
             <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg-tertiary)]/30 opacity-60 relative">
                <div className="px-4 py-3 flex items-center justify-between cursor-not-allowed">
                    <h4 className="font-bold text-[11px] uppercase tracking-widest text-[var(--text-muted)]">{title}</h4>
                    <span className="text-[9px] font-black text-red-400 uppercase tracking-wide bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Key Required</span>
                </div>
             </div>
        );
    }

    return (
        <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg-tertiary)]/50">
            <div 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
            >
                <h4 className="font-bold text-[11px] uppercase tracking-widest text-[var(--text-muted)]">{title}</h4>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-dim)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-dim)]" />}
            </div>
            {isExpanded && (
                <div className="p-1 space-y-0.5">
                    {models.map(model => (
                        <div 
                            key={model} 
                            onClick={() => onToggle(model)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group"
                        >
                            <span className="text-[13px] font-medium truncate max-w-[80%] text-[var(--text-muted)] group-hover:text-[var(--text-main)]">{model}</span>
                            <div className={`w-8 h-4.5 rounded-full relative transition-all duration-300 ${visibleModels.includes(model) ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)] border border-[var(--border)]'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 transform ${visibleModels.includes(model) ? 'translate-x-3.5 bg-white shadow-sm' : 'translate-x-0.5 bg-[var(--text-dim)]'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ThemePicker = ({ current, onSelect, onClose }: { current: ColorTheme, onSelect: (t: ColorTheme) => void, onClose: () => void }) => {
    const [search, setSearch] = useState('');
    const themes: ColorTheme[] = [
        'Default', 'Catppuccin', 'Dracula', 'Ghostty', 'GitHub', 'Gruvbox', 'Haze',
        'Tokyo Night', 'Solarized', 'Rose Pine', 'AAITN', 'One Dark Pro', 'Pierre', 'Nord'
    ];
    const filtered = themes.filter(t => t.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl z-[120] p-1 animate-in zoom-in-95 fade-in duration-150 backdrop-blur-xl">
            <div className="relative mb-1 border-b border-[var(--border)] pb-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-dim)]" />
                <input 
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent border-none focus:ring-0 text-[13px] pl-9 py-2.5 text-[var(--text-main)] placeholder-[var(--text-dim)]"
                />
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {filtered.map(theme => (
                    <div 
                        key={theme}
                        onClick={() => { onSelect(theme); onClose(); }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors group"
                    >
                        <span className={`text-[13px] font-semibold ${current === theme ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>{theme}</span>
                        {current === theme && <Check className="w-4 h-4 text-[var(--accent)]" />}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-[var(--text-dim)]">No themes found</div>
                )}
            </div>
        </div>
    );
};

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    settings, 
    onUpdateSettings, 
    labels, 
    onUpdateLabels, 
    onClearData, 
    onRepairWorkspace,
    sessions,
    messages,
    agents,
    sessionModels,
    onImportWorkspace
}) => {
  const [activeTab, setActiveTab] = useState('ai');
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(true);
  const [newLabelName, setNewLabelName] = useState('');
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const predefinedColors = ['#A1A1A1', '#737373', '#525252', '#F5F5F5', '#E5E5E5', '#D1D1D1'];

  const sidebarItems = [
    { id: 'general', title: 'General', subtitle: 'Identity and workspace', icon: Briefcase },
    { id: 'ai', title: 'AI', subtitle: 'Connect to AI providers', icon: Zap },
    { id: 'instructions', title: 'Instructions', subtitle: 'AI behavior prompt', icon: Shield },
    { id: 'appearance', title: 'Appearance', subtitle: 'Colors and themes', icon: Palette },
    { id: 'input', title: 'Input', subtitle: 'Shortcuts and behavior', icon: Keyboard },
    { id: 'labels', title: 'Labels', subtitle: 'Organize your chats', icon: Tag },
    { id: 'shortcuts', title: 'Shortcuts', subtitle: 'Keyboard navigation', icon: Keyboard },
  ];

  const currentTabTitle = sidebarItems.find(i => i.id === activeTab)?.title || activeTab;

  const handleTabSelect = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuVisible(false);
  };

  const handleAddLabel = () => {
      if(newLabelName.trim()) {
          const color = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
          onUpdateLabels([...labels, { id: Date.now().toString(), name: newLabelName.trim(), color }]);
          setNewLabelName('');
          setIsAddingLabel(false);
      }
  };

  const updateApiKey = (provider: keyof UserSettings['apiKeys'], value: string) => {
      onUpdateSettings({ ...settings, apiKeys: { ...settings.apiKeys, [provider]: value } });
  };

  const toggleModel = (model: string) => {
      const newVisible = settings.visibleModels.includes(model) ? settings.visibleModels.filter(m => m !== model) : [...settings.visibleModels, model];
      onUpdateSettings({ ...settings, visibleModels: newVisible });
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => { 
          if (re.target?.result) onUpdateSettings({ ...settings, workspaceIcon: re.target.result as string });
          e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
      const backup = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          settings,
          sessions,
          messages,
          agents,
          labels,
          sessionModels
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shuper-backup-${new Date().toISOString().split('T')[0]}.shuper`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const content = ev.target?.result as string;
              const data = JSON.parse(content);
              // Basic validation
              if (!data.settings || !data.sessions) throw new Error("Invalid format");
              onImportWorkspace(data);
          } catch (err) {
              alert("Invalid .shuper file format");
          }
          if (backupInputRef.current) backupInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const ShortcutItem = ({ keys, label }: { keys: string[], label: string }) => (
    <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/50 border border-[var(--border)] rounded-2xl group transition-all hover:border-[var(--text-dim)]">
        <span className="text-[13px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">{label}</span>
        <div className="flex gap-1.5">
            {keys.map((k, i) => (
                <React.Fragment key={i}>
                    <kbd className="min-w-[28px] px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[10px] font-bold text-[var(--text-main)] shadow-sm flex items-center justify-center uppercase tracking-tighter">{k}</kbd>
                    {i < keys.length - 1 && <span className="text-[var(--text-dim)] font-bold self-center text-[10px]">+</span>}
                </React.Fragment>
            ))}
        </div>
    </div>
  );

  const allModels = [...GEMINI_MODELS, ...OPENROUTER_FREE_MODELS, ...ROUTEWAY_MODELS];

  return (
    <div className="flex-1 flex h-full bg-[var(--bg-primary)] text-[var(--text-main)] font-inter relative">
      {/* Sidebar Navigation */}
      <div className={`${isMobileMenuVisible ? 'flex w-full' : 'hidden md:flex'} md:w-[280px] border-r border-[var(--border)] flex-col bg-[var(--bg-secondary)] transition-all duration-300`}>
         <div className="h-14 flex items-center px-6 border-b border-[var(--border)] shrink-0">
           <span className="font-bold text-sm text-[var(--text-main)]">Settings</span>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {sidebarItems.map(item => (
                <div 
                    key={item.id} 
                    onClick={() => handleTabSelect(item.id)} 
                    className={`flex items-start gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                        activeTab === item.id 
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm' 
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/50 hover:text-[var(--text-main)]'
                    }`}
                >
                    <item.icon className={`w-5 h-5 mt-0.5 transition-colors ${activeTab === item.id ? 'text-[var(--accent)]' : 'opacity-60'}`} />
                    <div>
                        <div className="text-[14px] font-semibold leading-tight">{item.title}</div>
                        <div className="text-[11px] font-medium opacity-60 mt-0.5">{item.subtitle}</div>
                    </div>
                </div>
            ))}
         </div>
      </div>
      
      {/* Main Settings Content */}
      <div className={`${!isMobileMenuVisible ? 'flex flex-1' : 'hidden md:flex'} flex-col flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 bg-[var(--bg-primary)]`}>
          <div className="md:hidden h-14 border-b border-[var(--border)] flex items-center px-4 shrink-0 bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-50">
            <button onClick={() => setIsMobileMenuVisible(true)} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center pr-9">
                <span className="font-bold text-sm text-[var(--text-main)]">{currentTabTitle}</span>
            </div>
          </div>

          <div className="max-w-2xl mx-auto py-12 md:py-16 px-6 md:px-8 w-full pb-32">
              <div className="mb-12 text-center">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-[var(--text-main)] lowercase">
                    {currentTabTitle}
                </h1>
                <p className="text-[13px] text-[var(--text-dim)] font-medium">Update your preferences.</p>
              </div>

              {activeTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div className="island-card border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-8 shadow-sm bg-[var(--bg-secondary)]">
                          <div className="flex items-center gap-6">
                              <div className="relative group">
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-20 h-20 rounded-3xl bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center cursor-pointer overflow-hidden transition-all group-hover:border-[var(--text-dim)]"
                                  >
                                      {settings.workspaceIcon ? (
                                        <img src={settings.workspaceIcon} className="w-full h-full object-cover" alt="Icon" />
                                      ) : (
                                        <ImageIcon className="w-7 h-7 text-[var(--text-dim)]" />
                                      )}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Camera className="w-5 h-5 text-white" />
                                      </div>
                                  </div>
                                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
                                  {settings.workspaceIcon && (
                                    <button 
                                      onClick={() => onUpdateSettings({ ...settings, workspaceIcon: undefined })}
                                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                              </div>
                              <div className="flex-1 space-y-4">
                                  <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest ml-1">Workspace Name</label>
                                      <input 
                                        value={settings.workspaceName} 
                                        onChange={e => onUpdateSettings({ ...settings, workspaceName: e.target.value })}
                                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--text-muted)] text-[var(--text-main)] transition-all"
                                      />
                                  </div>
                                  <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest ml-1">User Name</label>
                                      <input 
                                        value={settings.userName} 
                                        onChange={e => onUpdateSettings({ ...settings, userName: e.target.value })}
                                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--text-muted)] text-[var(--text-main)] transition-all"
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="island-card border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm bg-[var(--bg-secondary)]">
                          <h3 className="font-bold text-lg text-[var(--text-main)]">Backup & Restore</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <button 
                                onClick={handleExport}
                                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all group text-[var(--text-main)]"
                              >
                                  <Download className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                  <span className="text-sm font-bold">Download .shuper</span>
                              </button>
                              <div className="relative">
                                  <input 
                                      type="file" 
                                      ref={backupInputRef}
                                      onChange={handleFileImport}
                                      accept=".shuper,.json"
                                      className="hidden"
                                  />
                                  <button 
                                    onClick={() => backupInputRef.current?.click()}
                                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all group w-full text-[var(--text-main)]"
                                  >
                                      <Upload className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-bold">Upload Workspace</span>
                                  </button>
                              </div>
                          </div>
                          <p className="text-[11px] text-[var(--text-dim)] font-medium text-center px-4">
                            Your backup includes all chats, messages, agents, and API keys. Keep it safe.
                          </p>
                      </div>

                      <div className="island-card border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm bg-[var(--bg-secondary)]">
                          <h3 className="font-bold text-lg text-[var(--text-main)]">Danger Zone</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <button 
                                onClick={onRepairWorkspace}
                                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all group"
                              >
                                  <RefreshCcw className="w-4 h-4 text-orange-400 group-hover:rotate-180 transition-transform duration-500" />
                                  <span className="text-sm font-bold">Repair Workspace</span>
                              </button>
                              <button 
                                onClick={onClearData}
                                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-red-400 group"
                              >
                                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                  <span className="text-sm font-bold">Reset All Data</span>
                              </button>
                          </div>
                          <p className="text-[11px] text-[var(--text-dim)] font-medium text-center px-4">
                            Repairing rebuilds indexing. Resetting removes everything permanently.
                          </p>
                      </div>
                  </div>
              )}

              {activeTab === 'ai' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-8 shadow-sm island-card">
                          <h3 className="font-bold text-lg tracking-tight text-[var(--text-main)]">API Keys</h3>
                          <div className="space-y-6">
                              <ApiKeyInput label="Google Gemini" value={settings.apiKeys.gemini} onChange={(v) => updateApiKey('gemini', v)} placeholder="AIzaSy..." />
                              <ApiKeyInput label="Routeway.ai" value={settings.apiKeys.routeway} onChange={(v) => updateApiKey('routeway', v)} placeholder="sk-rw-..." />
                              <ApiKeyInput label="OpenRouter" value={settings.apiKeys.openRouter} onChange={(v) => updateApiKey('openRouter', v)} placeholder="sk-or-v1-..." />
                              <ApiKeyInput label="OpenRouter (Secondary)" value={settings.apiKeys.openRouterAlt} onChange={(v) => updateApiKey('openRouterAlt', v)} placeholder="sk-or-v1-..." description="Backup key when quota exceeded" />
                          </div>
                      </div>

                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm island-card">
                          <div className="space-y-1">
                              <h3 className="font-bold text-lg text-[var(--text-main)]">Default Model</h3>
                              <p className="text-xs text-[var(--text-dim)]">Used for background tasks (titles, labels) or when no model is selected.</p>
                          </div>
                          <div className="relative">
                              <select 
                                value={settings.defaultModel}
                                onChange={(e) => onUpdateSettings({...settings, defaultModel: e.target.value})}
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--text-muted)] text-[var(--text-main)] appearance-none cursor-pointer"
                              >
                                {allModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)] pointer-events-none" />
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h3 className="font-bold text-lg text-[var(--text-main)] px-2">Enabled Models</h3>
                          <div className="grid grid-cols-1 gap-3">
                            <ModelList 
                                title="Google Gemini" 
                                models={GEMINI_MODELS} 
                                visibleModels={settings.visibleModels} 
                                onToggle={toggleModel} 
                                disabled={!settings.apiKeys.gemini && !process.env.API_KEY}
                            />
                            <ModelList 
                                title="Routeway.ai" 
                                models={ROUTEWAY_MODELS} 
                                visibleModels={settings.visibleModels} 
                                onToggle={toggleModel} 
                                disabled={!settings.apiKeys.routeway}
                            />
                            <ModelList 
                                title="OpenRouter (Free)" 
                                models={OPENROUTER_FREE_MODELS} 
                                visibleModels={settings.visibleModels} 
                                onToggle={toggleModel} 
                                disabled={!settings.apiKeys.openRouter && !settings.apiKeys.openRouterAlt}
                            />
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'instructions' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div className="island-card border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm bg-[var(--bg-secondary)]">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                                <Shield className="w-5 h-5" />
                             </div>
                             <div>
                                <h3 className="font-bold text-lg text-[var(--text-main)]">System Instructions</h3>
                                <p className="text-[11px] text-[var(--text-dim)] font-medium">Define how the AI perceives its role and constraints.</p>
                             </div>
                          </div>
                          <textarea 
                            value={settings.baseKnowledge} 
                            onChange={e => onUpdateSettings({ ...settings, baseKnowledge: e.target.value })}
                            placeholder="E.g. You are a high-fidelity workspace assistant. Always be direct and use technical language..."
                            className="w-full min-h-[300px] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl p-6 text-[15px] text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--text-muted)] transition-all resize-none leading-relaxed"
                          />
                          <div className="flex items-center gap-2 text-[var(--text-dim)] px-2">
                             <Sparkles className="w-3.5 h-3.5" />
                             <span className="text-[11px] font-medium italic">This instruction applies across all models and agents in the workspace.</span>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'input' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div className="island-card border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-8 shadow-sm bg-[var(--bg-secondary)]">
                          <h3 className="font-bold text-lg text-[var(--text-main)]">Send Behavior</h3>
                          <div className="space-y-4">
                              <p className="text-sm text-[var(--text-muted)] font-medium">Choose your preferred keyboard shortcut for sending messages.</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {[
                                      { id: 'Enter', label: 'Enter', subtitle: 'Send on Enter, New line on Shift+Enter' },
                                      { id: 'Ctrl+Enter', label: 'Ctrl + Enter', subtitle: 'Send on Ctrl+Enter, New line on Enter' }
                                  ].map(opt => (
                                      <div 
                                        key={opt.id}
                                        onClick={() => onUpdateSettings({ ...settings, sendKey: opt.id as any })}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                                            settings.sendKey === opt.id 
                                                ? 'bg-[var(--bg-elevated)] border-[var(--text-muted)] shadow-md' 
                                                : 'bg-[var(--bg-tertiary)] border-[var(--border)] hover:border-[var(--text-dim)]'
                                        }`}
                                      >
                                          <div className="flex items-center justify-between mb-2">
                                              <span className="font-bold text-[var(--text-main)]">{opt.label}</span>
                                              {settings.sendKey === opt.id && <Check className="w-4 h-4 text-[var(--accent)]" />}
                                          </div>
                                          <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">{opt.subtitle}</p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'appearance' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div>
                        <h4 className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-[0.1em] ml-1 mb-3">Default View</h4>
                        <div className="island-card border border-[var(--border)] rounded-2xl px-1 shadow-sm overflow-visible bg-[var(--bg-secondary)]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 py-4 gap-3 overflow-visible">
                                <span className="text-[14px] font-semibold text-[var(--text-main)]">Mode</span>
                                <div className="flex p-0.5 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border)]">
                                    {[
                                        { id: 'system', label: 'System', icon: Monitor },
                                        { id: 'light', label: 'Light', icon: Sun },
                                        { id: 'dark', label: 'Dark', icon: Moon }
                                    ].map(mode => (
                                        <button 
                                            key={mode.id}
                                            onClick={() => onUpdateSettings({ ...settings, theme: mode.id as any })}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium ${
                                                settings.theme === mode.id 
                                                    ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] shadow-sm ring-1 ring-[var(--border)]' 
                                                    : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'
                                            }`}
                                        >
                                            <mode.icon className="w-4 h-4" />
                                            <span>{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="h-[1px] bg-[var(--border)] mx-4" />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 py-4 relative gap-3 overflow-visible">
                                <span className="text-[14px] font-semibold text-[var(--text-main)]">Color theme</span>
                                <div className="relative w-full sm:w-auto">
                                  <div 
                                      onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                                      className="flex items-center justify-between sm:justify-start gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--text-dim)] transition-all text-[13px] text-[var(--text-main)] font-medium select-none group"
                                  >
                                      <span>{settings.colorTheme}</span>
                                      <ChevronDown className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--text-muted)] transition-colors" />
                                  </div>
                                  {isThemeMenuOpen && (
                                      <>
                                          <div className="fixed inset-0 z-[110]" onClick={() => setIsThemeMenuOpen(false)} />
                                          <div className="relative sm:absolute right-0 top-full mt-2 w-full sm:w-64 z-[120]">
                                            <ThemePicker 
                                                current={settings.colorTheme} 
                                                onSelect={(t) => onUpdateSettings({ ...settings, colorTheme: t })}
                                                onClose={() => setIsThemeMenuOpen(false)}
                                            />
                                          </div>
                                      </>
                                  )}
                                </div>
                            </div>

                            <div className="h-[1px] bg-[var(--border)] mx-4" />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 py-4 gap-3 overflow-visible">
                                <span className="text-[14px] font-semibold text-[var(--text-main)]">Font</span>
                                <div className="flex p-0.5 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border)]">
                                    {[
                                        { id: 'Inter', label: 'Inter' },
                                        { id: 'System', label: 'System' }
                                    ].map(font => (
                                        <button 
                                            key={font.id}
                                            onClick={() => onUpdateSettings({ ...settings, fontFamily: font.id as any })}
                                            className={`flex-1 sm:px-6 py-1.5 rounded-lg transition-all text-[13px] font-bold ${
                                                settings.fontFamily === font.id 
                                                    ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] shadow-sm' 
                                                    : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'
                                            }`}
                                        >
                                            {font.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                      </div>
                  </div>
              )}

              {activeTab === 'shortcuts' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                       <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-3xl p-4 md:p-8 space-y-6 shadow-sm island-card">
                          <div className="grid grid-cols-1 gap-3">
                              <ShortcutItem keys={['Alt', 'N']} label="New Chat" />
                              <ShortcutItem keys={['Alt', 'S']} label="Search" />
                              <ShortcutItem keys={['Alt', 'P']} label="Settings" />
                              <ShortcutItem keys={['Alt', '.']} label="Toggle Sidebar" />
                              <ShortcutItem keys={['Alt', 'Left']} label="Back History" />
                              <ShortcutItem keys={['Alt', 'Right']} label="Forward History" />
                              <ShortcutItem keys={['Shift', 'Tab']} label="Toggle Mode" />
                              <ShortcutItem keys={['ArrowUp']} label="Edit Last Message" />
                          </div>
                       </div>
                  </div>
              )}

              {activeTab === 'labels' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm island-card">
                          <div className="flex items-center justify-between mb-8">
                              <h3 className="font-bold text-lg text-[var(--text-main)]">Tags</h3>
                              <button onClick={() => setIsAddingLabel(true)} className="bg-[var(--accent)] text-[var(--bg-primary)] px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90">Add Tag</button>
                          </div>
                          {isAddingLabel && (
                              <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)]">
                                  <input autoFocus value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder="Tag Name" className="flex-1 bg-transparent text-[var(--text-main)] text-sm focus:outline-none" onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()} />
                                  <div className="flex gap-2"><button onClick={handleAddLabel} className="p-2 text-emerald-500 rounded-xl hover:bg-emerald-500/10"><Check className="w-4 h-4" /></button><button onClick={() => setIsAddingLabel(false)} className="p-2 text-red-500 rounded-xl hover:bg-red-500/10"><X className="w-4 h-4" /></button></div>
                              </div>
                          )}
                          <div className="space-y-1">
                              {labels.map(label => (
                                  <div key={label.id} className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-elevated)]/50 rounded-xl group transition-all">
                                      <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                                          <span className="text-[14px] font-semibold text-[var(--text-main)]">{label.name}</span>
                                      </div>
                                      <button onClick={() => onUpdateLabels(labels.filter(l => l.id !== label.id))} className="text-[var(--text-dim)] hover:text-red-500 md:opacity-0 group-hover:opacity-100 p-2 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
