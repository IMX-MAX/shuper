
import { GoogleGenAI, Type } from "@google/genai";
import { Attachment, OPENROUTER_FREE_MODELS, SessionMode, UserSettings, Label, ROUTEWAY_MODELS, Agent } from "../types";

/**
 * Generates a concise title for a session using the Gemini API.
 */
export const generateSessionTitle = async (
  history: {role: string, parts: any[]}[], 
  currentTitle: string,
  modelName: string = 'gemini-3-flash-preview',
  apiKey?: string
): Promise<string> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) return currentTitle;

  const ai = new GoogleGenAI({ apiKey: key });
  try {
    const chatHistory = history.slice(-6).map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: h.parts
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...chatHistory,
        { 
          role: 'user', 
          parts: [{ text: "Summarize this conversation into a 3-5 word title. Return ONLY the title text, no quotes or punctuation." }] 
        }
      ],
      config: {
        temperature: 0.5,
      }
    });
    
    return response.text?.trim() || currentTitle;
  } catch (error) {
    console.error("Title generation error:", error);
    return currentTitle;
  }
};

/**
 * Suggests appropriate labels from available list based on conversation content.
 */
export const suggestLabels = async (
  history: {role: string, parts: any[]}[],
  availableLabels: Label[],
  apiKey?: string
): Promise<string[]> => {
  if (availableLabels.length === 0) return [];
  const key = apiKey || process.env.API_KEY;
  if (!key) return [];

  const ai = new GoogleGenAI({ apiKey: key });
  try {
    const labelContext = availableLabels.map(l => `${l.id}: ${l.name}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.slice(-10),
        {
          role: 'user',
          parts: [{ text: `Based on the conversation history provided, which of the following labels apply? Return a JSON array of label IDs only.\nAvailable Labels:\n${labelContext}` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Label suggestion error:", error);
    return [];
  }
};

/**
 * Sends a message to Gemini or an OpenAI-compatible provider.
 */
export const sendMessageToGemini = async (
  message: string, 
  history: {role: string, parts: any[]}[], 
  systemInstruction: string | undefined,
  attachments: Attachment[] = [],
  useThinking: boolean = false,
  onUpdate?: (content: string, thoughtProcess?: string) => void,
  apiKeys?: UserSettings['apiKeys'],
  modelName: string = 'gemini-3-flash-preview',
  mode: SessionMode = 'explore',
  signal?: AbortSignal
): Promise<{ text: string; thoughtProcess?: string }> => {
  
  const trimmedModel = modelName.trim();

  // PRE-PROCESS ATTACHMENTS FOR ALL PROVIDERS
  let finalMessage = message;
  const geminiParts: any[] = [];
  
  attachments.forEach(att => {
      const base64Data = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
      
      if (att.type.startsWith('text/') || att.type === 'application/json' || att.type.includes('javascript') || att.type.includes('typescript')) {
          try {
              const textContent = decodeURIComponent(escape(atob(base64Data)));
              finalMessage = (finalMessage ? finalMessage + '\n\n' : '') + `[Attachment: ${att.name}]\n\`\`\`\n${textContent}\n\`\`\`\n`;
          } catch (e) {
              console.error("Error decoding text attachment", e);
              geminiParts.push({
                  inlineData: {
                      mimeType: att.type,
                      data: base64Data
                  }
              });
          }
      } else {
          geminiParts.push({
              inlineData: {
                  mimeType: att.type,
                  data: base64Data
              }
          });
      }
  });
  
  const isRouteway = ROUTEWAY_MODELS.includes(trimmedModel);
  const actualModel = trimmedModel;
  const isOpenRouter = OPENROUTER_FREE_MODELS.includes(trimmedModel) || (trimmedModel.includes(':free') && !isRouteway);

  let finalModel = actualModel;
  if (mode === 'execute' && !isOpenRouter && !isRouteway && !actualModel.includes('gemini-3-pro')) {
      finalModel = 'gemini-3-pro-preview';
  }

  let updatedSystemInstruction = `You are running in Shuper, an advanced AI workspace.\n${systemInstruction || ''}`;

  if (isOpenRouter || isRouteway) {
      return sendMessageToOpenAICompatible(
          finalMessage, 
          history, 
          updatedSystemInstruction, 
          useThinking, 
          onUpdate, 
          apiKeys, 
          finalModel,
          signal
      );
  }

  const geminiKey = apiKeys?.gemini || process.env.API_KEY;
  if (!geminiKey) return { text: "Missing Gemini API Key. Please add it in Settings." };

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  
  try {
    if (finalMessage && finalMessage.trim()) geminiParts.push({ text: finalMessage });
    else if (geminiParts.length === 0) geminiParts.push({ text: " " });

    const config: any = {
        systemInstruction: updatedSystemInstruction.trim() || undefined,
    };

    const isThinkingSupported = finalModel.includes('gemini-3') || finalModel.includes('gemini-2.5');

    if (isThinkingSupported) {
        if (mode === 'execute') {
            config.thinkingConfig = { thinkingBudget: 32768 }; 
        } else {
            config.thinkingConfig = { thinkingBudget: 0 };
        }
    }

    const responseStream = await ai.models.generateContentStream({
      model: finalModel,
      contents: [...history, { role: 'user', parts: geminiParts }],
      config: config,
      signal
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      if (signal?.aborted) throw new Error("AbortError");
      const chunkText = chunk.text || "";
      fullText += chunkText;
      if (onUpdate) onUpdate(fullText, undefined); 
    }

    return { text: fullText };
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'AbortError') {
        return { text: "[Stopped by user]" };
    }
    console.error("Gemini API Error:", error);
    return { text: `Error: ${error.message || "Failed to communicate with Gemini"}` };
  }
};

const PROXIES = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    // Fallback proxy if corsproxy.io is down
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

async function fetchJsonWithRetry(url: string, options: RequestInit, providerName: string): Promise<any> {
    // 1. Try Direct Fetch first
    try {
        const response = await fetch(url, options);
        if (response.ok) return await response.json();
        
        // 400/401/403 often mean configuration error or key error, not CORS
        // But 403 can also be WAF/CORS. We throw to try proxy unless it's strictly 400/401.
        if (response.status === 400 || response.status === 401) {
             const errText = await response.text();
             throw new Error(`${response.status}: ${errText}`);
        }
        
        throw new Error(`Direct fetch failed with status ${response.status}`);
    } catch (e: any) {
        console.warn(`[${providerName}] Direct fetch failed, attempting proxies...`, e.message);
    }

    // 2. Try Proxies
    // IMPORTANT: Proxies need to forward our custom headers (x-api-key, etc.)
    // We strip headers that browsers or proxies might override or reject.
    const proxyHeaders = { ...options.headers } as Record<string, string>;
    delete proxyHeaders['HTTP-Referer'];
    delete proxyHeaders['X-Title'];
    delete proxyHeaders['Origin'];
    delete proxyHeaders['Referer'];
    delete proxyHeaders['Host'];

    // Ensure options include the cleaned headers
    const proxyOptions = { 
        ...options, 
        headers: proxyHeaders, 
        credentials: 'omit' as RequestCredentials 
    };

    let lastError: any;
    for (const proxyGen of PROXIES) {
        try {
            const proxyUrl = proxyGen(url);
            const response = await fetch(proxyUrl, proxyOptions);

            if (!response.ok) {
                 let errText = await response.text().catch(() => '');
                 try {
                    const json = JSON.parse(errText);
                    errText = json.error?.message || json.message || errText;
                 } catch {}
                 
                 // Fatal errors (Bad Request, Unauthorized) usually mean the API received it but rejected it
                 if (response.status === 400 || response.status === 401) {
                    throw new Error(`API Error ${response.status}: ${errText.slice(0, 100)}`);
                 }
                 throw new Error(`Proxy Status ${response.status}: ${errText.slice(0, 100)}`);
            }
            
            return await response.json();
        } catch (e: any) {
            console.warn(`[${providerName}] Proxy failed via ${proxyGen(url).split('?')[0]}`, e);
            lastError = e;
        }
    }
    
    throw new Error(`${providerName} connection failed. Browser blocked request (CORS) or proxy is down. Details: ${lastError?.message || 'Unknown'}`);
}

/**
 * Searches Scira.
 */
export const searchScira = async (query: string, apiKey: string | undefined): Promise<string> => {
    if (!apiKey) throw new Error("Scira API Key is missing.");
    const endpoint = 'https://api.scira.ai/api/search';
    
    // Scira uses 'x-api-key' header
    return await fetchJsonWithRetry(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey.trim()
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: query }] })
    }, 'Scira').then(data => {
        if (data.text) {
            let res = data.text;
            if (data.sources?.length) res += `\n\n---\n**Sources:**\n` + data.sources.map((s: string) => `- <${s}>`).join('\n');
            return res;
        }
        return "No structured text returned from Scira.";
    });
};

/**
 * Searches Exa.
 */
export const searchExa = async (query: string, apiKey: string | undefined): Promise<string> => {
    if (!apiKey) throw new Error("Exa API Key is missing.");
    const endpoint = 'https://api.exa.ai/search';

    // Exa uses 'x-api-key' header
    return await fetchJsonWithRetry(endpoint, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey.trim(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: query,
            type: "auto",
            num_results: 10,
            contents: { highlights: { max_characters: 2000 } }
        })
    }, 'Exa').then(data => {
        if (data.results?.length) {
            return data.results.map((r: any, i: number) => {
                const hl = r.highlights?.[0] || r.text || 'No snippet';
                return `**${i + 1}. [${r.title || 'Untitled'}](${r.url || '#'})**\n> ${hl}\n`;
            }).join('\n');
        }
        return "No results returned from Exa.";
    });
};

/**
 * Searches Tavily.
 */
export const searchTavily = async (query: string, apiKey: string | undefined): Promise<string> => {
    if (!apiKey) throw new Error("Tavily API Key is missing.");
    const endpoint = 'https://api.tavily.com/search';
    
    // Tavily accepts api_key in body, which is safest for proxies
    return await fetchJsonWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: apiKey.trim(),
            query: query,
            topic: "general",
            search_depth: "basic",
            max_results: 5,
            include_answer: true
        })
    }, 'Tavily').then(data => {
        let res = "";
        if (data.answer) res += `**Direct Answer:**\n${data.answer}\n\n---\n`;
        if (data.results?.length) {
            res += data.results.map((r: any, i: number) => 
                `**${i + 1}. [${r.title}](${r.url})**\n> ${r.content || 'No snippet'}\n`
            ).join('\n');
        } else {
            res += "No detailed results returned from Tavily.";
        }
        return res;
    });
};

const sendMessageToOpenAICompatible = async (
    message: string, 
    history: {role: string, parts: any[]}[], 
    systemInstruction: string | undefined,
    useThinking: boolean,
    onUpdate: ((content: string, thoughtProcess?: string) => void) | undefined,
    apiKeys: UserSettings['apiKeys'] | undefined, 
    modelName: string,
    signal?: AbortSignal
): Promise<{ text: string; thoughtProcess?: string }> => {
    
    if (!apiKeys) return { text: `API configuration missing. Please check Settings.` };

    const trimmedModel = modelName.trim();
    const isRouteway = ROUTEWAY_MODELS.includes(trimmedModel);
    let fullUrl = isRouteway ? 'https://api.routeway.ai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';

    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });

    history.forEach(h => {
        const content = h.parts.filter(p => p.text).map(p => p.text).join(' ');
        if (content.trim()) messages.push({ role: h.role === 'model' ? 'assistant' : 'user', content });
    });

    messages.push({ role: 'user', content: message });

    const tryFetch = async (keyToUse: string): Promise<Response> => {
        return await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${keyToUse}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Shuper Workspace'
            },
            body: JSON.stringify({
                model: trimmedModel,
                messages: messages,
                stream: true,
                ...(useThinking && { reasoning_effort: "high" })
            }),
            signal
        });
    };

    try {
        let keyToTry = isRouteway ? apiKeys.routeway : apiKeys.openRouter;
        if (!keyToTry && !isRouteway && apiKeys.openRouterAlt) keyToTry = apiKeys.openRouterAlt;
        if (!keyToTry) throw new Error(`API Key for ${isRouteway ? 'Routeway' : 'OpenRouter'} missing.`);

        let response = await tryFetch(keyToTry);

        if (response.status === 429 && !isRouteway && apiKeys.openRouterAlt && keyToTry !== apiKeys.openRouterAlt) {
            console.log("Primary OpenRouter key quota hit, switching to alternative key...");
            response = await tryFetch(apiKeys.openRouterAlt);
        }

        if (!response.ok) {
            let errorMessage = `API Error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage += ` - ${errorData.error?.message || errorData.error || 'Unknown error'}`;
            } catch (e) {
                const text = await response.text().catch(() => '');
                if (text) errorMessage += ` - ${text.slice(0, 100)}`;
            }
            throw new Error(errorMessage);
        }
        
        if (!response.body) throw new Error("No response body received from provider.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let fullThinking = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = (buffer + chunk).split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === 'data: [DONE]') break;
                if (!trimmed.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(trimmed.slice(6));
                    const delta = json.choices[0]?.delta;
                    const content = delta?.content || '';
                    const reasoning = delta?.reasoning_content || delta?.reasoning || '';

                    if (reasoning) {
                        fullThinking += reasoning;
                        if (onUpdate) onUpdate(fullText, fullThinking);
                    }

                    if (content) {
                        fullText += content;
                        if (onUpdate) onUpdate(fullText, fullThinking || undefined);
                    }
                } catch (e) {}
            }
        }
        return { text: fullText, thoughtProcess: fullThinking || undefined };
    } catch (error: any) {
        if (error.name === 'AbortError') return { text: "[Stopped by user]" };
        console.error(`${trimmedModel} API Error:`, error);
        return { text: `${error.message || "Failed to communicate with provider API"}` };
    }
};
