
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Inbox, Layout, User, Rocket, ShieldAlert, AlertTriangle, Trash2, Wrench, Menu, PlusCircle, Command, ShieldCheck, Loader2, ChevronRight, X, Check, ArrowRight } from 'lucide-react';
import { SidebarNavigation } from './components/SidebarNavigation';
import { SessionList } from './components/SessionList';
import { ChatInterface } from './components/ChatInterface';
import { SettingsView } from './components/SettingsView';
import { AgentsView } from './components/AgentsView';
import { WhatsNewModal } from './components/WhatsNewModal';
import { TourOverlay } from './components/TourOverlay';
import { 
    Session, 
    Message, 
    SessionStatus, 
    Label, 
    UserSettings, 
    Agent, 
    Attachment, 
    OPENROUTER_FREE_MODELS, 
    GEMINI_MODELS, 
    ROUTEWAY_MODELS,
    SessionMode
} from './types';
import { sendMessageToGemini, generateSessionTitle, searchScira, searchExa, searchTavily } from './services/geminiService';

const DEFAULT_LABELS: Label[] = [
    { id: '1', name: 'Design', color: '#A1A1A1' },
    { id: '2', name: 'Research', color: '#737373' },
    { id: '3', name: 'Priority', color: '#F5F5F5' },
];

const DEFAULT_SETTINGS: UserSettings = {
    theme: 'dark',
    colorTheme: 'Default',
    fontFamily: 'Inter',
    accentColor: '#F5F5F5',
    workspaceName: 'shuper - your favorite AI executor',
    visibleModels: [],
    defaultModel: '',
    userName: 'User',
    timezone: 'UTC',
    language: 'English',
    city: 'San Francisco',
    country: 'USA',
    baseKnowledge: '',
    sendKey: 'Enter',
    onboardingComplete: false,
    enableTasks: false,
    apiKeys: {
        gemini: '',
        openRouter: '',
        openRouterAlt: '',
        routeway: '',
        scira: '',
        exa: '',
        tavily: ''
    }
};

const getSystemInstruction = (userName: string, mode: SessionMode, availableLabels: Label[]) => `
IDENTITY:
You are a high-performance assistant operating within the "Shuper" workspace environment.
CURRENT MODE: ${mode.toUpperCase()}

STRICT CONVERSATION RULES:
1. NO SIGN-OFFS. Just answer the question.
2. NO META-TALK. Don't explain your thoughts in brackets.
3. BE DIRECT. Get straight to the point.
4. BE PERSONAL. Use the user's name (${userName}) naturally.
5. FORMATTING. ${mode === 'explore' ? 'Answer directly without a formal plan.' : 'Start your response with a quick list of what you are going to do using hyphens (-).'}

${mode === 'execute' ? `
EXECUTE MODE (PLANNING):
Briefly list the steps you will take.
Example:
- Look at the request.
- Prepare the answer.
[Your answer here]
` : ''}

AVAILABLE LABELS (TAGS):
${availableLabels.length > 0 ? availableLabels.map(l => `- ${l.name}`).join('\n') : 'No labels available.'}

CAPABILITIES:
- [[TITLE: New Title]] - Change the chat name. ONLY use this if explicitly asked to rename the chat. DO NOT rename chats automatically.
- [[STATUS: backlog | todo | needs_review | done | cancelled | archive]] - Change chat status.
- [[LABEL: Label Name]] - Add a tag. IMPORTANT: ONLY use existing labels listed above. DO NOT create or invent new ones. If a relevant label is not in the list, do not use the LABEL command.
`;

/**
 * Custom hook to manage state synchronized with localStorage.
 * Includes a debounce mechanism to prevent high-frequency disk writes (e.g. during typing).
 */
function useStickyState<T>(defaultValue: T, key: string, debounceMs: number = 0): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      if (stickyValue !== null) {
          const parsed = JSON.parse(stickyValue);
          if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
              return { ...defaultValue, ...parsed };
          }
          return parsed;
      }
      return defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    const persist = () => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.warn("Storage limit reached. Older history might not be saved.");
        }
      }
    };

    if (debounceMs > 0) {
      const timeoutId = setTimeout(persist, debounceMs);
      return () => clearTimeout(timeoutId);
    } else {
      persist();
    }
  }, [key, value, debounceMs]);

  return [value, setValue];
}

const OnboardingModal: React.FC<{ onComplete: (name: string, workspace: string) => void, onStartExit: () => void }> = ({ onComplete, onStartExit }) => {
    const [name, setName] = useState('');
    const [workspace, setWorkspace] = useState('');
    const [isExiting, setIsExiting] = useState(false);

    const handleComplete = () => {
        if (name && workspace) {
            setIsExiting(true);
            onStartExit();
            setTimeout(() => {
                onComplete(name, workspace);
            }, 1200);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white text-black font-inter select-none overflow-hidden p-6 ${isExiting ? 'animate-onboard-exit' : ''}`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.3] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Content Container */}
            <div className={`relative z-10 w-full max-w-4xl flex flex-col items-center text-center ${!isExiting ? 'animate-fly-in-up' : ''}`}>
                
                {/* Main Heading */}
                <h1 className="text-[4rem] md:text-[7rem] leading-[0.9] font-black tracking-tighter mb-6 text-black">
                    Welcome to<br/>Shuper
                </h1>

                {/* Subtext Section */}
                <div className="text-xl md:text-2xl font-medium text-gray-400 mb-16 tracking-tight">
                    the most productive AI workspace maybe ever
                </div>

                {/* Input Fields Area */}
                <div className="w-full max-w-sm space-y-6 mb-12">
                    <div className="group relative">
                        <input 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="What's your name?"
                            className="w-full bg-transparent border-b border-gray-200 py-3 text-lg font-medium text-black placeholder-gray-400 focus:outline-none focus:border-black transition-all text-center"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && document.getElementById('workspace-input')?.focus()}
                        />
                    </div>
                    <div className="group relative">
                        <input 
                            id="workspace-input"
                            value={workspace}
                            onChange={e => setWorkspace(e.target.value)}
                            placeholder="Name your workspace"
                            className="w-full bg-transparent border-b border-gray-200 py-3 text-lg font-medium text-black placeholder-gray-400 focus:outline-none focus:border-black transition-all text-center"
                            onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
                        />
                    </div>
                </div>

                {/* CTA Button */}
                <button 
                    onClick={handleComplete}
                    disabled={!name || !workspace}
                    className="group relative inline-flex items-center justify-center gap-2 px-10 py-4 bg-black text-white rounded-full text-sm font-bold tracking-wide hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-xl"
                >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Footer Link */}
                <div className="mt-12 text-[10px] text-gray-400 font-medium tracking-[0.2em] uppercase">
                    shuper.app.local
                </div>
            </div>
            
            {/* Decorative Card mimic */}
            <div className={`absolute bottom-10 left-10 hidden lg:block bg-white border border-gray-100 p-4 rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] max-w-xs rotate-2 ${!isExiting ? 'animate-fly-in-up' : ''} ${isExiting ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                <div className="text-xs text-gray-500 mb-2 font-medium">Hello, {name || 'Stranger'}. What would you like to build today?</div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <div className="w-3 h-3 rounded-full bg-black/10"></div>
                    Claude 3.5 Sonnet
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{ title: string, description: string, onConfirm: () => void, onCancel: () => void }> = ({ title, description, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-[360px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                    <Trash2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black tracking-tight text-white">Delete Permanently?</h3>
                    <p className="text-[10px] font-bold text-red-500/80 tracking-wide">Careful</p>
                </div>
            </div>
            <p className="text-[13px] text-[var(--text-muted)] font-medium mb-10 leading-relaxed">
                This will remove "{title}" forever. You can't undo this.
            </p>
            <div className="flex flex-col gap-2">
                <button 
                    onClick={onConfirm}
                    className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-500 transition-all active:scale-[0.98] shadow-lg shadow-red-600/10"
                >
                    Delete Now
                </button>
                <button 
                    onClick={onCancel}
                    className="w-full py-4 bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold rounded-2xl hover:text-[var(--text-main)] transition-colors"
                >
                    Keep It
                </button>
            </div>
        </div>
    </div>
);

type ViewType = 'chat' | 'agents' | 'settings';
interface NavigationState {
  view: ViewType;
  sessionId?: string;
}

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSubSidebarVisible, setIsSubSidebarVisible] = useState(true);
  const [isMobileSessionListOpen, setIsMobileSessionListOpen] = useState(true);
  const [isTourActive, setIsTourActive] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState(0);
  
  const [logoClicks, setLogoClicks] = useState(0);
  const [isLogoGlowing, setIsLogoGlowing] = useState(false);
  const [isLanding, setIsLanding] = useState(false);

  const [settings, setSettings] = useStickyState<UserSettings>(DEFAULT_SETTINGS, 'shuper_settings');
  const [availableLabels, setAvailableLabels] = useStickyState<Label[]>(DEFAULT_LABELS, 'shuper_labels');
  const [agents, setAgents] = useStickyState<Agent[]>([], 'shuper_agents');
  const [sessions, setSessions] = useStickyState<Session[]>([], 'shuper_sessions');
  
  // Persistence with debounce to prevent typing lag
  const [sessionMessages, setSessionMessages] = useStickyState<Record<string, Message[]>>({}, 'shuper_messages', 1000);
  const [sessionDrafts, setSessionDrafts] = useStickyState<Record<string, string>>({}, 'shuper_drafts', 500);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Track active session ID in a Ref to access it inside stale closures (async operations)
  const activeSessionIdRef = useRef<string | null>(null);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);

  const [sessionLoading, setSessionLoading] = useState<Record<string, boolean>>({});
  const [sessionModels, setSessionModels] = useStickyState<Record<string, string>>({}, 'shuper_session_models');

  const [currentFilter, setCurrentFilter] = useState('all');
  const [history, setHistory] = useState<NavigationState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  
  // Lifted state for title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'chat' | 'agent', id: string, title: string } | null>(null);
  const abortControllers = useRef<Record<string, AbortController>>({});

  // Disable Browser Context Menu Globally
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const hasAnyKey = useMemo(() => {
    return !!(process.env.API_KEY || settings.apiKeys.gemini || settings.apiKeys.openRouter || settings.apiKeys.openRouterAlt || settings.apiKeys.routeway || settings.apiKeys.scira || settings.apiKeys.exa || settings.apiKeys.tavily);
  }, [settings.apiKeys]);

  const createSessionObject = (): Session => ({
      id: Date.now().toString(),
      title: 'New Chat',
      subtitle: 'Explore',
      timestamp: 'Just now',
      category: 'TODAY',
      status: 'todo',
      labelIds: [],
      tasks: [],
      hasNewResponse: false,
      isFlagged: false,
      mode: 'explore',
      councilModels: GEMINI_MODELS.slice(0, 3)
  });

  const applyHistoryState = useCallback((state: NavigationState) => {
    setCurrentView(state.view);
    if (state.sessionId) {
      setActiveSessionId(state.sessionId);
      // Clear badge when navigating via history
      setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === state.sessionId ? { ...s, hasNewResponse: false } : s) : prev);
    }
  }, []);

  const handleBack = useCallback(() => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const prevState = history[newIndex];
          setHistoryIndex(newIndex);
          applyHistoryState(prevState);
      }
  }, [historyIndex, history, applyHistoryState]);

  const handleForward = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const nextState = history[newIndex];
          setHistoryIndex(newIndex);
          applyHistoryState(nextState);
      }
  }, [historyIndex, history, applyHistoryState]);

  const navigateTo = useCallback((view: ViewType, sessionId?: string) => {
    const newState: NavigationState = { view, sessionId };
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Don't push duplicate states
    const lastState = newHistory[newHistory.length - 1];
    if (lastState && lastState.view === view && lastState.sessionId === sessionId) {
      return;
    }

    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    applyHistoryState(newState);
  }, [history, historyIndex, applyHistoryState]);

  useEffect(() => {
    if (currentView === 'chat' && !activeSessionId && Array.isArray(sessions) && sessions.length > 0) {
      navigateTo('chat', sessions[0].id);
    }
  }, [sessions, activeSessionId, currentView, navigateTo]);

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Alt + . toggle both panels (Changed from Ctrl + .)
      if (e.altKey && e.key === '.') {
        e.preventDefault();
        const shouldBeVisible = !isSidebarVisible || !isSubSidebarVisible;
        setIsSidebarVisible(shouldBeVisible);
        setIsSubSidebarVisible(shouldBeVisible);
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handleNewSession();
            break;
          case 'p':
            e.preventDefault();
            navigateTo('settings');
            break;
          case 's':
            e.preventDefault();
            navigateTo('chat');
            setIsMobileSessionListOpen(true);
            setTriggerSearch(prev => prev + 1);
            break;
          case 'b':
            e.preventDefault();
            setIsSidebarVisible(prev => !prev);
            break;
          case 'arrowleft':
            e.preventDefault();
            handleBack();
            break;
          case 'arrowright':
            e.preventDefault();
            handleForward();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [sessions, currentView, activeSessionId, handleBack, handleForward, isSidebarVisible, isSubSidebarVisible, navigateTo]);

  useEffect(() => {
      if (settings.onboardingComplete) {
          if (sessions.length === 0 && currentView === 'chat') {
              handleNewSession();
          }
      }
  }, [settings.onboardingComplete]);

  // Robust Theme Effect
  useEffect(() => {
    const applyTheme = () => {
      let mode = settings.theme;
      if (settings.theme === 'system') {
        mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      if (mode === 'light') {
        document.body.classList.add('light-mode');
      } else {
        document.body.classList.remove('light-mode');
      }
      
      document.body.setAttribute('data-theme', settings.colorTheme);
      document.body.setAttribute('data-font', settings.fontFamily);
      document.documentElement.style.setProperty('--accent', settings.accentColor);
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (settings.theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings.theme, settings.accentColor, settings.colorTheme, settings.fontFamily]);

  const filteredSessions = useMemo(() => {
    const sessionArr = Array.isArray(sessions) ? sessions : [];
    
    if (currentFilter === 'archived') {
        return sessionArr.filter(s => s.status === 'archive');
    }

    if (currentFilter.startsWith('status:')) {
        const status = currentFilter.split(':')[1] as SessionStatus;
        return sessionArr.filter(s => s.status === status);
    }
    if (currentFilter.startsWith('label:')) {
        const labelId = currentFilter.split(':')[1];
        return sessionArr.filter(s => s.labelIds.includes(labelId));
    }
    switch (currentFilter) {
        case 'flagged': return sessionArr.filter(s => s.isFlagged);
        case 'all': default: return sessionArr.filter(s => s.status !== 'archive');
    }
  }, [sessions, currentFilter]);

  const statusCounts = useMemo(() => {
      const counts: Record<string, number> = { backlog: 0, todo: 0, needs_review: 0, done: 0, cancelled: 0, archive: 0 };
      if (Array.isArray(sessions)) {
          sessions.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++; });
      }
      return counts as Record<SessionStatus, number>;
  }, [sessions]);

  const activeSession = Array.isArray(sessions) ? sessions.find(s => s.id === activeSessionId) : null;
  const activeMessages = activeSessionId ? (sessionMessages[activeSessionId] || []) : [];
  const activeLoading = activeSessionId ? (sessionLoading[activeSessionId] || false) : false;

  const handleLogoClick = () => {
    setLogoClicks(prev => {
        const next = prev + 1;
        if (next >= 10) {
            setIsLogoGlowing(true);
        }
        return next;
    });
    };

  const handleUpdateSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
  }, [setSettings]);

  const handleSelectSession = (id: string) => {
      if (id === activeSessionId) {
          setIsMobileSessionListOpen(false);
          return;
      }
      navigateTo('chat', id);
      setIsMobileSessionListOpen(false);

      // Clear new response badge when selecting a session
      setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === id ? { ...s, hasNewResponse: false } : s) : prev);
  };

  const handleNewSession = () => {
      const newSession = createSessionObject();
      setSessions(prev => [newSession, ...(Array.isArray(prev) ? prev : [])]);
      setSessionMessages(prev => ({ ...prev, [newSession.id]: [] }));
      
      // Only set a default model if configured in settings
      if (hasAnyKey && (settings.defaultModel || settings.visibleModels.length > 0)) {
          const defaultModel = settings.defaultModel || settings.visibleModels[0];
          setSessionModels(prev => ({ ...prev, [newSession.id]: defaultModel }));
      }

      handleSelectSession(newSession.id);
  };

  const handleRegenerateTitle = async (sessionId: string) => {
      const messages = sessionMessages[sessionId];
      if (!messages || messages.length === 0) return;
      
      const session = Array.isArray(sessions) ? sessions.find(s => s.id === sessionId) : null;
      if (!session) return;

      const historyData = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
      }));

      const newTitle = await generateSessionTitle(historyData, session.title, settings.defaultModel, settings.apiKeys.gemini);
      setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s) : prev);
  };

  const executeAICommands = (text: string, sessionId: string) => {
    const statusMatch = text.match(/\[\[STATUS:\s*(.*?)\]\]/);
    if (statusMatch) {
        const newStatus = statusMatch[1].trim().toLowerCase() as SessionStatus;
        if (['backlog', 'todo', 'needs_review', 'done', 'cancelled', 'archive'].includes(newStatus)) {
            setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === sessionId ? { ...s, status: newStatus } : s) : prev);
        }
    }

    const titleMatch = text.match(/\[\[TITLE:\s*(.*?)\]\]/);
    if (titleMatch) {
        const newTitle = titleMatch[1].trim();
        if (newTitle) {
            setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s) : prev);
        }
    }

    const labelMatch = text.match(/\[\[LABEL:\s*(.*?)\]\]/);
    if (labelMatch) {
        const labelName = labelMatch[1].trim();
        const existingLabel = availableLabels.find(l => l.name.toLowerCase() === labelName.toLowerCase());
        if (existingLabel) {
            const lid = existingLabel.id;
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, labelIds: s.labelIds.includes(lid) ? s.labelIds : [...s.labelIds, lid] } : s));
        }
    }

    return text
        .replace(/\[\[STATUS:.*?\]\]/g, '')
        .replace(/\[\[TITLE:.*?\]\]/g, '')
        .replace(/\[\[LABEL:.*?\]\]/g, '')
        .trim();
  };

  const handleStopGeneration = (sessionId: string) => {
    if (abortControllers.current[sessionId]) {
        abortControllers.current[sessionId].abort();
        delete abortControllers.current[sessionId];
        setSessionLoading(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[], useThinking: boolean, mode: SessionMode, useSearch: boolean, searchProvider: 'scira' | 'exa' | 'tavily', existingMsgId?: string) => {
    if (!activeSessionId) return;
    const currentSessionId = activeSessionId; 

    const modelId = sessionModels[currentSessionId];
    if (!modelId) return;

    // Strict rename logic: Only rename if it is explicitly "New Chat" and this is the first interaction.
    const currentSessionMessages = sessionMessages[currentSessionId] || [];
    const isFirstMessage = currentSessionMessages.length === 0;

    if (activeSession?.title === 'New Chat' && text && !existingMsgId && isFirstMessage) {
        setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === currentSessionId && s.title === 'New Chat' ? { ...s, title: text.slice(0, 30) + (text.length > 30 ? '...' : '') } : s) : prev);
    }

    let newMessageId = Date.now().toString();
    if (existingMsgId) {
        newMessageId = existingMsgId;
        setSessionMessages(prev => ({
            ...prev,
            [currentSessionId]: (prev[currentSessionId] || []).map(m => m.id === existingMsgId ? { ...m, content: text, attachments: attachments } : m)
        }));
    } else {
        const newMessage: Message = {
            id: newMessageId,
            role: 'user',
            content: text,
            timestamp: new Date(),
            attachments: attachments
        };
        setSessionMessages(prev => ({
            ...prev,
            [currentSessionId]: [...(prev[currentSessionId] || []), newMessage]
        }));
    }

    setSessionLoading(prev => ({ ...prev, [currentSessionId]: true }));
    const controller = new AbortController();
    abortControllers.current[currentSessionId] = controller;

    const currentMsgs = sessionMessages[currentSessionId] || [];
    let aiMessageId = (Date.now() + 1).toString();
    const userMsgIndex = currentMsgs.findIndex(m => m.id === newMessageId);
    
    if (existingMsgId && userMsgIndex !== -1 && currentMsgs[userMsgIndex + 1]?.role === 'model') {
        aiMessageId = currentMsgs[userMsgIndex + 1].id;
        setSessionMessages(prev => ({
            ...prev,
            [currentSessionId]: prev[currentSessionId].map(m => m.id === aiMessageId ? { ...m, content: '', thoughtProcess: undefined } : m)
        }));
    } else {
        const initialAiMessage: Message = {
            id: aiMessageId,
            role: 'model',
            content: '',
            timestamp: new Date(),
            thoughtProcess: undefined
        };
        if (existingMsgId && userMsgIndex !== -1) {
            setSessionMessages(prev => {
                const updated = [...(prev[currentSessionId] || [])];
                updated.splice(userMsgIndex + 1, 0, initialAiMessage);
                return { ...prev, [currentSessionId]: updated };
            });
        } else {
            setSessionMessages(prev => ({
                ...prev,
                [currentSessionId]: [...(prev[currentSessionId] || []), initialAiMessage]
            }));
        }
    }

    try {
        let enhancedText = text;
        let searchThought = "";

        // SEARCH LOGIC
        if (useSearch) {
            let apiKey = '';
            if (searchProvider === 'scira') apiKey = settings.apiKeys.scira;
            else if (searchProvider === 'exa') apiKey = settings.apiKeys.exa;
            else if (searchProvider === 'tavily') apiKey = settings.apiKeys.tavily;
            
            const providerName = searchProvider === 'scira' ? 'Scira' : (searchProvider === 'exa' ? 'Exa' : 'Tavily');

            if (apiKey) {
                setSessionMessages(prev => {
                    const msgs = prev[currentSessionId] || [];
                    return { ...prev, [currentSessionId]: msgs.map(m => m.id === aiMessageId ? { ...m, thoughtProcess: `Searching the web with ${providerName}...` } : m) };
                });

                try {
                    let searchResult = "";
                    if (searchProvider === 'scira') {
                        searchResult = await searchScira(text, apiKey);
                    } else if (searchProvider === 'exa') {
                        searchResult = await searchExa(text, apiKey);
                    } else if (searchProvider === 'tavily') {
                        searchResult = await searchTavily(text, apiKey);
                    }
                    
                    searchThought = `_**${providerName} Search Performed**_\n\n_Based on your query, I searched for information._\n\n`;
                    enhancedText = `CONTEXT FROM WEB SEARCH (Use this to answer the user request):\n${searchResult}\n\nUSER QUERY:\n${text}`;
                } catch (err: any) {
                    console.error("Search Failed", err);
                    searchThought = `**${providerName} Search Failed**: ${err.message}\n\n`;
                }
            }
        }

        const finalMsgsAfterStateUpdate = sessionMessages[currentSessionId] || [];
        const currentIndex = finalMsgsAfterStateUpdate.findIndex(m => m.id === newMessageId);
        
        // Construct history, but for the *current* user message (last one), use the potentially enhanced text
        const historyData = finalMsgsAfterStateUpdate.slice(0, currentIndex).map(m => {
            const parts: any[] = [];
            if (m.content && m.content.trim()) parts.push({ text: m.content });
            if (m.attachments && m.attachments.length > 0) {
                m.attachments.forEach(att => {
                    if (!att.data) return;
                    const base64Data = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
                    parts.push({ inlineData: { mimeType: att.type, data: base64Data } });
                });
            }
            if (parts.length === 0) parts.push({ text: " " });
            return { role: m.role, parts: parts };
        });

        const agent = agents.find(a => a.id === modelId);
        let baseInst = settings.baseKnowledge;
        let actualModel = modelId;

        if (agent) {
            baseInst = `${agent.systemInstruction}\n\nUser Context: ${settings.baseKnowledge}`;
            actualModel = agent.baseModel;
            
            // Inject Connected Tools Context
            if (agent.tools && agent.tools.length > 0) {
                const toolDescriptions = agent.tools.map(t => {
                    if (t.type === 'mcp') return `- MCP Server: ${t.config} (Connected)`;
                    if (t.type === 'api_linear') return `- Linear API Integration (Connected via Key)`;
                    return `- ${t.name}: ${t.config}`;
                }).join('\n');
                
                baseInst += `\n\nCONNECTED CAPABILITIES:\nYou have been connected to the following external tools and APIs:\n${toolDescriptions}\n\nWhen the user asks to interact with these services (e.g. "Create a linear issue", "Read craft doc"), assume you have the capability to do so via function calling or context retrieval.`;
            }
        }

        const systemInstruction = `${baseInst}\n\n${getSystemInstruction(settings.userName, mode, availableLabels)}`;
        
        const onStreamUpdate = (content: string, thoughtProcess?: string) => {
            setSessionMessages(prev => {
                const msgs = prev[currentSessionId] || [];
                const combinedThought = (searchThought ? searchThought + (thoughtProcess ? '\n---\n' : '') : '') + (thoughtProcess || '');
                return {
                    ...prev,
                    [currentSessionId]: msgs.map(m => m.id === aiMessageId ? { ...m, content, thoughtProcess: combinedThought || undefined } : m)
                };
            });
        };

        let response;
        if (mode === 'council' && activeSession?.councilModels) {
            setSessionMessages(prev => ({
                ...prev,
                [currentSessionId]: (prev[currentSessionId] || []).map(m => m.id === aiMessageId ? { ...m, thoughtProcess: 'Convening the Council: Models are deliberating in parallel...', model: 'council' } : m)
            }));

            // Fetch parallel responses
            const modelResponses = await Promise.all(activeSession.councilModels.map(async (mId) => {
                const res = await sendMessageToGemini(
                    enhancedText, 
                    historyData, 
                    systemInstruction, 
                    attachments, 
                    false, 
                    undefined, 
                    settings.apiKeys, 
                    mId,
                    'explore', 
                    controller.signal
                );
                return { model: mId, text: res.text };
            }));

            const responsesText = modelResponses.map(r => `Response from [${r.model}]:\n${r.text}`).join('\n\n---\n\n');

            const synthesisPrompt = `You are the Council Synthesizer. Review the following responses from different AI models to the user query: "${text}". 
            Resolve conflicts where possible, highlight key differences, and present a final unified answer. 
            MANDATORY: Include a comparison table showing where the models agree and disagree.
            
            ${responsesText}`;

            response = await sendMessageToGemini(synthesisPrompt, historyData, systemInstruction, [], false, onStreamUpdate, settings.apiKeys, 'gemini-3-flash-preview', 'explore', controller.signal);
            
            // Append the raw outputs to the synthesized response
            let finalOutput = response.text + "\n\n---\n\n### 🏛️ Council Records\n\n";
            
            modelResponses.forEach(r => {
                const modelName = r.model.split('/').pop()?.split(':')[0] || r.model;
                finalOutput += `<details><summary><strong>${modelName}</strong></summary>\n\n${r.text}\n\n</details>\n\n`;
            });
            
            response.text = finalOutput;

        } else {
            response = await sendMessageToGemini(
                enhancedText, 
                historyData, 
                systemInstruction, 
                attachments, 
                mode === 'execute', 
                onStreamUpdate,
                settings.apiKeys,
                actualModel,
                mode,
                controller.signal
            );
        }
        
        let cleanText = executeAICommands(response.text, currentSessionId);
        
        // Fallback for models that might return empty content but have valid reasoning (e.g. specialized thinking models)
        if (!cleanText && (response.thoughtProcess || searchThought) && mode !== 'council') {
             // If we have thoughts but no content, check if we should just show thoughts or error
             // We can leave cleanText empty, but ensure thoughtProcess is updated. 
             // Ideally we might want to prompt user to check thoughts.
        } else if (!cleanText && !response.thoughtProcess && !searchThought) {
             cleanText = "Error: The model returned an empty response.";
        }
        
        setSessionMessages(prev => {
            const msgs = prev[currentSessionId] || [];
            const combinedThought = (searchThought ? searchThought + (response.thoughtProcess ? '\n---\n' : '') : '') + (response.thoughtProcess || '');
            return {
                ...prev,
                [currentSessionId]: msgs.map(m => m.id === aiMessageId ? { ...m, content: cleanText, thoughtProcess: combinedThought || undefined, model: mode === 'council' ? 'council' : actualModel } : m)
            };
        });

        // Use Ref to check against the CURRENT active session, avoiding stale closure
        if (currentSessionId !== activeSessionIdRef.current) {
            setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === currentSessionId ? { ...s, hasNewResponse: true } : s) : prev);
        }

    } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error("Failed to send message", e);
        const errorText = e.message || "Unknown error";
        setSessionMessages(prev => {
            const msgs = prev[currentSessionId] || [];
            return { ...prev, [currentSessionId]: msgs.map(m => m.id === aiMessageId ? { ...m, content: `Error: ${errorText}` } : m) };
        });
    } finally {
        setSessionLoading(prev => ({ ...prev, [currentSessionId]: false }));
        delete abortControllers.current[currentSessionId];
    }
  };

  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleRepairWorkspace = () => {
    setSessions([]);
    setSessionMessages({});
    setAvailableLabels(DEFAULT_LABELS);
    setActiveSessionId(null);
    handleNewSession();
  };

  const handleImportWorkspace = (data: any) => {
      if (!data) return;
      try {
          // Basic Validation
          if (!data.settings || !data.sessions) throw new Error("Invalid backup file");

          // Merge settings to ensure new fields (like apiKeys) are present
          const mergedSettings = {
              ...DEFAULT_SETTINGS,
              ...data.settings,
              apiKeys: {
                  ...DEFAULT_SETTINGS.apiKeys,
                  ...(data.settings.apiKeys || {})
              }
          };

          // Direct LocalStorage Write to prevent React state race conditions during restore
          try {
              window.localStorage.setItem('shuper_settings', JSON.stringify(mergedSettings));
              window.localStorage.setItem('shuper_sessions', JSON.stringify(data.sessions));
              
              if (data.messages) window.localStorage.setItem('shuper_messages', JSON.stringify(data.messages));
              if (data.agents) window.localStorage.setItem('shuper_agents', JSON.stringify(data.agents));
              if (data.labels) window.localStorage.setItem('shuper_labels', JSON.stringify(data.labels));
              if (data.sessionModels) window.localStorage.setItem('shuper_session_models', JSON.stringify(data.sessionModels));
          } catch (e: any) {
              if (e.name === 'QuotaExceededError') {
                  alert('Storage limit exceeded. Import failed. Try clearing data first.');
                  return;
              }
              throw e;
          }
          
          // Force reload to apply changes from a clean state
          window.location.reload(); 
      } catch (e) {
          console.error("Import failed", e);
          alert('Failed to import workspace. The file might be corrupted.');
      }
  };

  const updateSessionStatus = (id: string, s: SessionStatus) => setSessions(prev => Array.isArray(prev) ? prev.map(sess => sess.id === id ? { ...sess, status: s } : sess) : prev);
  const updateSessionMode = (id: string, m: SessionMode) => setSessions(prev => Array.isArray(prev) ? prev.map(sess => sess.id === id ? { ...sess, mode: m } : sess) : prev);
  const updateSessionLabels = (id: string, lid: string) => setSessions(prev => Array.isArray(prev) ? prev.map(s => {
      if (s.id !== id) return s;
      const hasLabel = s.labelIds.includes(lid);
      return { ...s, labelIds: hasLabel ? s.labelIds.filter(x => x !== lid) : [...s.labelIds, lid] };
  }) : prev);
  const toggleSessionFlag = (id: string) => setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === id ? { ...s, isFlagged: !s.isFlagged } : s) : prev);
  const updateCouncilModels = (id: string, models: string[]) => setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === id ? { ...s, councilModels: models } : s) : prev);
  const handleMarkUnread = (id: string) => setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === id ? { ...s, hasNewResponse: true } : s) : prev);

  const deleteSession = (id: string) => {
      const messages = sessionMessages[id] || [];
      if (messages.length === 0) {
          // If this is the last session, replace it with a new one
          if (sessions.length === 1 && sessions[0].id === id) {
              const newSession = createSessionObject();
              setSessions([newSession]);
              setSessionMessages({ [newSession.id]: [] });
              setActiveSessionId(newSession.id);
              // Only default model if present
              if (hasAnyKey && (settings.defaultModel || settings.visibleModels.length > 0)) {
                  const defaultModel = settings.defaultModel || settings.visibleModels[0];
                  setSessionModels({ [newSession.id]: defaultModel });
              }
              return;
          }

          setSessions(prev => Array.isArray(prev) ? prev.filter(s => s.id !== id) : prev);
          if (activeSessionId === id) {
              const remaining = sessions.filter(s => s.id !== id);
              if (remaining.length > 0) handleSelectSession(remaining[0].id);
              else setActiveSessionId(null);
          }
      } else {
          const session = sessions.find(s => s.id === id);
          setDeleteConfirmation({ type: 'chat', id, title: session?.title || 'this chat' });
      }
  };

  const handleConfirmDelete = () => {
      if (!deleteConfirmation) return;
      if (deleteConfirmation.type === 'chat') {
          const id = deleteConfirmation.id;
          
          if (sessions.length === 1 && sessions[0].id === id) {
              const newSession = createSessionObject();
              setSessions([newSession]);
              setSessionMessages(prev => {
                  const newState = { ...prev };
                  delete newState[id];
                  newState[newSession.id] = [];
                  return newState;
              });
              setActiveSessionId(newSession.id);
              if (hasAnyKey && (settings.defaultModel || settings.visibleModels.length > 0)) {
                  const defaultModel = settings.defaultModel || settings.visibleModels[0];
                  setSessionModels(prev => {
                      const newState = { ...prev };
                      delete newState[id];
                      newState[newSession.id] = defaultModel;
                      return newState;
                  });
              }
          } else {
              setSessions(prev => Array.isArray(prev) ? prev.filter(s => s.id !== id) : prev);
              if (activeSessionId === id) {
                  const remaining = sessions.filter(s => s.id !== id);
                  if (remaining.length > 0) handleSelectSession(remaining[0].id);
                  else setActiveSessionId(null);
              }
          }
      } else {
          setAgents(prev => prev.filter(a => a.id !== deleteConfirmation.id));
      }
      setDeleteConfirmation(null);
  };

  const renameSession = (id: string, t: string) => setSessions(prev => Array.isArray(prev) ? prev.map(s => s.id === id ? { ...s, title: t } : s) : prev);
  const handleUpdateAgent = (updatedAgent: Agent) => setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  const deleteAgent = (id: string) => {
      const agent = agents.find(a => a.id === id);
      setDeleteConfirmation({ type: 'agent', id, title: agent?.name || 'this agent' });
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-primary)] overflow-hidden text-sm font-inter text-[var(--text-main)] relative">
      {!settings.onboardingComplete && !isTourActive && (
          <OnboardingModal 
            onStartExit={() => setIsLanding(true)}
            onComplete={(name, workspace) => {
              setSettings({ ...settings, userName: name, workspaceName: workspace });
              setIsTourActive(true);
            }} 
          />
      )}

      <div className={`flex w-full h-full ${isLanding ? 'animate-workspace-enter' : ''}`}>
        {isTourActive && (
            <TourOverlay 
                onComplete={() => {
                    setSettings({ ...settings, onboardingComplete: true });
                    setIsTourActive(false);
                }} 
                onSkip={() => {
                    setSettings({ ...settings, onboardingComplete: true });
                    setIsTourActive(false);
                }}
                onNewSession={() => {
                    if (sessions.length === 0) handleNewSession();
                    navigateTo('chat');
                }}
            />
        )}

        {deleteConfirmation && (
            <DeleteConfirmationModal 
                title={deleteConfirmation.title}
                description={deleteConfirmation.type === 'chat' ? 'this chat' : 'this agent'}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmation(null)}
            />
        )}

        {isMobileSidebarOpen && (
            <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={() => setIsMobileSidebarOpen(false)} />
        )}

        <div className={`
            fixed md:relative inset-y-0 left-0 z-50 
            transform transition-all duration-500 ease-in-out 
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            ${isSidebarVisible ? 'md:translate-x-0 md:w-[260px] md:opacity-100 md:visible' : 'md:-translate-x-full md:w-0 md:opacity-0 md:invisible'}
            overflow-hidden h-full bg-[var(--bg-primary)]
        `}>
            <SidebarNavigation 
                currentFilter={currentFilter} 
                onSetFilter={(f) => {
                    setCurrentFilter(f);
                    setIsMobileSidebarOpen(false);
                    setIsMobileSessionListOpen(true);
                }} 
                onNewSession={() => {
                    handleNewSession();
                    setIsMobileSidebarOpen(false);
                }}
                onBack={handleBack}
                onForward={handleForward}
                canBack={historyIndex > 0}
                canForward={historyIndex < history.length - 1}
                statusCounts={statusCounts}
                availableLabels={availableLabels}
                currentView={currentView}
                onChangeView={(v) => {
                    navigateTo(v);
                    setIsMobileSidebarOpen(false);
                }}
                workspaceName={settings.workspaceName}
                workspaceIcon={settings.workspaceIcon}
                onShowWhatsNew={() => setIsWhatsNewOpen(true)}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
                onLogoClick={handleLogoClick}
                isLogoGlowing={isLogoGlowing}
            />
        </div>

        {isWhatsNewOpen && <WhatsNewModal isOpen={isWhatsNewOpen} onClose={() => setIsWhatsNewOpen(false)} />}

        <div className="flex-1 flex overflow-hidden relative p-0 md:p-6 md:pl-0 md:gap-4 transition-all duration-500">
            {currentView === 'chat' && (
                <div className="flex flex-1 animate-in fade-in zoom-in-95 duration-300 gap-0 md:gap-4 overflow-hidden h-full">
                    <div className={`
                        w-full md:w-[300px] flex-shrink-0 
                        transition-all duration-500 ease-in-out
                        ${isMobileSessionListOpen ? 'block' : 'hidden'} 
                        ${isSubSidebarVisible ? 'md:translate-x-0 md:w-[300px] md:opacity-100 md:visible' : 'md:-translate-x-full md:w-0 md:opacity-0 md:invisible'}
                        md:block rounded-none md:rounded-2xl overflow-hidden island-card h-full
                    `}>
                        <SessionList 
                            sessions={filteredSessions} 
                            activeSessionId={activeSessionId || ''} 
                            onSelectSession={handleSelectSession}
                            onUpdateSessionStatus={updateSessionStatus} 
                            onDeleteSession={deleteSession}
                            onRenameSession={renameSession}
                            onRegenerateTitle={handleRegenerateTitle}
                            availableLabels={availableLabels}
                            onToggleLabel={updateSessionLabels}
                            onCreateLabel={(l) => setAvailableLabels(prev => [...prev, l])}
                            sessionLoading={sessionLoading}
                            onNewSession={handleNewSession}
                            onToggleFlag={toggleSessionFlag}
                            currentFilter={currentFilter}
                            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
                            triggerSearch={triggerSearch}
                            onEditTitle={(val) => setIsEditingTitle(val)}
                            onMarkUnread={handleMarkUnread}
                        />
                    </div>
                    
                    <div className={`flex-1 transition-all duration-300 h-full ${!isMobileSessionListOpen || !activeSessionId ? 'block' : 'hidden md:block'} rounded-none md:rounded-2xl overflow-hidden island-card h-full`}>
                        {activeSession ? (
                            <ChatInterface 
                                key={activeSession.id}
                                session={activeSession}
                                messages={activeMessages} 
                                onSendMessage={handleSendMessage}
                                onStopGeneration={() => handleStopGeneration(activeSessionId!)}
                                isLoading={activeLoading}
                                onUpdateStatus={(status) => updateSessionStatus(activeSessionId!, status)}
                                onUpdateMode={(mode) => updateSessionMode(activeSessionId!, mode)}
                                availableLabels={availableLabels}
                                onUpdateLabels={(labelId) => updateSessionLabels(activeSessionId!, labelId)}
                                onCreateLabel={(l) => setAvailableLabels(prev => [...prev, l])}
                                onDeleteSession={() => deleteSession(activeSessionId!)}
                                onRenameSession={(title) => renameSession(activeSessionId!, title)}
                                onRegenerateTitle={handleRegenerateTitle}
                                onToggleFlag={() => toggleSessionFlag(activeSessionId!)}
                                onChangeView={(v) => navigateTo(v)}
                                onNewSession={handleNewSession}
                                visibleModels={settings.visibleModels}
                                agents={agents}
                                currentModel={activeSessionId ? (sessionModels[activeSessionId] || '') : ''}
                                onSelectModel={(m) => {
                                    if(activeSessionId) setSessionModels(prev => ({...prev, [activeSessionId]: m}));
                                }}
                                onUpdateCouncilModels={(models) => updateCouncilModels(activeSessionId!, models)}
                                sendKey={settings.sendKey}
                                hasOpenRouterKey={!!(settings.apiKeys.openRouter || settings.apiKeys.openRouterAlt)}
                                hasRoutewayKey={!!settings.apiKeys.routeway}
                                hasSciraKey={!!settings.apiKeys.scira}
                                hasExaKey={!!settings.apiKeys.exa}
                                hasTavilyKey={!!settings.apiKeys.tavily}
                                onBackToList={() => setIsMobileSessionListOpen(true)}
                                onOpenSidebar={() => setIsMobileSidebarOpen(true)}
                                hasAnyKey={hasAnyKey}
                                userSettings={settings}
                                draftValue={activeSessionId ? (sessionDrafts[activeSessionId] || '') : ''}
                                onDraftChange={(val) => {
                                    if(activeSessionId) setSessionDrafts(prev => ({...prev, [activeSessionId]: val}));
                                }}
                                isEditingTitle={isEditingTitle}
                                setIsEditingTitle={setIsEditingTitle}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-[var(--text-dim)] bg-[var(--bg-tertiary)] flex-col gap-2 h-full">
                                <div className="md:hidden absolute top-4 left-4">
                                    <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 bg-[var(--bg-elevated)] rounded-lg text-[var(--text-main)]">
                                        <Menu className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mb-4 shadow-lg">
                                    <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" strokeWidth={2} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {currentView === 'settings' && (
                <div className="flex flex-1 animate-in fade-in zoom-in-95 duration-300 rounded-none md:rounded-2xl overflow-hidden island-card h-full">
                    <SettingsView 
                        settings={settings} 
                        onUpdateSettings={handleUpdateSettings}
                        labels={availableLabels}
                        onUpdateLabels={setAvailableLabels}
                        onClearData={handleClearData}
                        onRepairWorkspace={handleRepairWorkspace}
                        sessions={sessions}
                        messages={sessionMessages}
                        agents={agents}
                        sessionModels={sessionModels}
                        onImportWorkspace={handleImportWorkspace}
                    />
                </div>
            )}

            {currentView === 'agents' && (
                <div className="flex flex-1 animate-in fade-in zoom-in-95 duration-300 rounded-none md:rounded-2xl overflow-hidden island-card h-full">
                    <AgentsView 
                        agents={agents}
                        onCreateAgent={(a) => setAgents(prev => [...prev, a])}
                        onDeleteAgent={deleteAgent}
                        onUpdateAgent={handleUpdateAgent}
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
