import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, PanelRightClose, Bot, FileText, ChevronUp, Eye, Edit3, Type, List, CheckSquare, Wand2, SpellCheck } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessageToGemini } from '../services/geminiService';
import { UserSettings } from '../types';

interface DocsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
  userSettings: UserSettings;
}

export const DocsPanel: React.FC<DocsPanelProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  onUpdateTitle, 
  onUpdateContent,
  userSettings
}) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Sync content state to editable div when opened or updated externally
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.innerText !== content && !isProcessing) {
       // Only update if significantly different to avoid cursor jumping, usually handled better with separate draft state
       // For simple use case:
       if (document.activeElement !== contentEditableRef.current) {
          contentEditableRef.current.innerText = content;
       }
    }
  }, [content, isOpen]);

  const handleAssistantSubmit = async (customPrompt?: string) => {
    const promptText = customPrompt || assistantInput;
    if (!promptText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setAssistantResponse(null);
    setIsAssistantOpen(true);
    
    const prompt = `
      Context: The user is writing a document titled "${title}".
      Current Content:
      ${content}
      
      User Request: ${promptText}
      
      Instructions: Provide a helpful response to the user's request. 
      If they ask to rewrite or add sections, provide the text directly. 
      Keep it concise and relevant to the document context.
    `;

    try {
      const response = await sendMessageToGemini(
        prompt, 
        [], 
        "You are a helpful document assistant inside Shuper.", 
        [], 
        false, 
        (text) => setAssistantResponse(text),
        userSettings.apiKeys,
        'gemini-3-flash-preview',
        'explore'
      );
      setAssistantResponse(response.text);
    } catch (e) {
      setAssistantResponse("Sorry, I encountered an error processing your request.");
    } finally {
      setIsProcessing(false);
      setAssistantInput('');
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const text = e.currentTarget.innerText;
      onUpdateContent(text);
      
      // Live Markdown Logic
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      
      // Basic detection for # Heading
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.endsWith('# ') && node.textContent.length === 2) {
         // This is a naive implementation. Building a full RTE is complex. 
         // For now, we rely on the user typing markdown and the Preview mode to render it.
         // Or we can try to wrap it in a block.
      }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
          const selection = window.getSelection();
          if (!selection || !selection.anchorNode) return;
          
          const text = selection.anchorNode.textContent || '';
          
          // Live Bold: **text** -> Bold
          // This is extremely hard to do correctly with contentEditable without a library.
          // Instead, we will simulate the "Editor" feel by styling the container.
      }
  };

  return (
    <div className={`fixed inset-0 z-[60] bg-[var(--bg-secondary)] transition-all duration-300 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-[var(--text-main)]">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-bold tracking-tight">{title || 'Untitled'}</span>
             </div>
             <div className="h-4 w-[1px] bg-[var(--border)]" />
             <div className="flex bg-[var(--bg-elevated)] p-0.5 rounded-lg border border-[var(--border)]">
                <button 
                  onClick={() => setMode('edit')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${mode === 'edit' ? 'bg-[var(--bg-secondary)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'}`}
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                <button 
                  onClick={() => setMode('preview')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${mode === 'preview' ? 'bg-[var(--bg-secondary)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'}`}
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-elevated)] rounded-full text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors">
            <PanelRightClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[var(--bg-primary)]">
          <div className="max-w-4xl mx-auto py-12 px-8 min-h-full">
            {mode === 'edit' ? (
                <div className="animate-in fade-in duration-300">
                  <input 
                    value={title}
                    onChange={(e) => onUpdateTitle(e.target.value)}
                    className="w-full bg-transparent text-4xl font-bold text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none mb-8 font-inter"
                    placeholder="Page title"
                  />
                  <div
                    ref={contentEditableRef}
                    contentEditable
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-[var(--text-main)] focus:outline-none leading-relaxed text-lg font-inter min-h-[60vh] empty:before:content-[attr(placeholder)] empty:before:text-[var(--text-dim)] outline-none"
                    placeholder="Start writing... Markdown is supported."
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                </div>
            ) : (
                <div className="markdown-body">
                    <h1 className="text-4xl font-bold mb-8 text-[var(--text-main)] border-b-0 pb-0">{title}</h1>
                    <Markdown remarkPlugins={[remarkGfm]}>{content || '*No content*'}</Markdown>
                </div>
            )}
          </div>
        </div>

        {/* AI Assistant Overlay */}
        {isOpen && (
            <div className={`absolute bottom-6 right-6 left-auto w-full max-w-[400px] transition-all duration-300 z-50`}>
            {isAssistantOpen ? (
                <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 flex flex-col max-h-[600px]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-dim)]">Suggestions</span>
                        <button onClick={() => setIsAssistantOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text-main)]">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {!assistantResponse && (
                        <div className="space-y-1 mb-4">
                            <button onClick={() => handleAssistantSubmit("Create a summary of this document")} className="w-full flex items-center gap-3 p-2.5 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors text-left group">
                                <List className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)]">Create a Summary</span>
                            </button>
                            <button onClick={() => handleAssistantSubmit("Rewrite this to improve clarity")} className="w-full flex items-center gap-3 p-2.5 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors text-left group">
                                <Wand2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)]">Improve Clarity</span>
                            </button>
                            <button onClick={() => handleAssistantSubmit("Check for spelling and grammar errors")} className="w-full flex items-center gap-3 p-2.5 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors text-left group">
                                <SpellCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)]">Improve Spelling and Grammar</span>
                            </button>
                        </div>
                    )}
                    
                    {assistantResponse && (
                        <div className="mb-4 flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-tertiary)] p-3 rounded-xl text-sm text-[var(--text-main)] markdown-body border border-[var(--border)]">
                            <Markdown remarkPlugins={[remarkGfm]}>{assistantResponse}</Markdown>
                        </div>
                    )}

                    {/* Bottom Status Card */}
                    {isProcessing && (
                         <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-3 mb-3 flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
                                 <Sparkles className="w-4 h-4 animate-spin text-[var(--accent)]" />
                             </div>
                             <div>
                                 <div className="text-xs font-bold text-[var(--text-main)]">Thinking...</div>
                                 <div className="text-[10px] text-[var(--text-dim)]">Updates to make in {title}</div>
                             </div>
                         </div>
                    )}

                    <div className="relative">
                        <input 
                            value={assistantInput}
                            onChange={(e) => setAssistantInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAssistantSubmit()}
                            placeholder="Message Craft Assistant..."
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl pl-4 pr-10 py-3 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--text-muted)] placeholder-[var(--text-dim)]"
                            autoFocus
                        />
                        <button 
                            onClick={() => handleAssistantSubmit()}
                            disabled={!assistantInput.trim() || isProcessing}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--bg-elevated)] text-[var(--text-dim)] hover:text-[var(--text-main)] rounded-lg transition-all disabled:opacity-50"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-end">
                <button 
                    onClick={() => setIsAssistantOpen(true)}
                    className="flex items-center gap-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-full px-5 py-3 shadow-2xl text-sm font-bold text-[var(--text-main)] transition-all group hover:scale-105"
                >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span>Message Shuper</span>
                </button>
                </div>
            )}
            </div>
        )}
      </div>
    </div>
  );
};