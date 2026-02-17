
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
  // This ensures text files are seen by OpenRouter/Routeway/Gemini equally.
  let finalMessage = message;
  const geminiParts: any[] = [];
  
  attachments.forEach(att => {
      const base64Data = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
      
      if (att.type.startsWith('text/')) {
          try {
              // Decode base64 to text and append to the message prompt
              const textContent = decodeURIComponent(escape(atob(base64Data)));
              finalMessage = (finalMessage ? finalMessage + '\n\n' : '') + `[File: ${att.name}]\n\`\`\`\n${textContent}\n\`\`\`\n`;
          } catch (e) {
              console.error("Error decoding text attachment", e);
          }
      } else {
          // For images/PDFs, only used for Gemini parts currently
          geminiParts.push({
              inlineData: {
                  mimeType: att.type,
                  data: base64Data
              }
          });
      }
  });
  
  // Check if model is in the Routeway list.
  const isRouteway = ROUTEWAY_MODELS.includes(trimmedModel);

  // Use the model ID exactly as is (including :free) to ensure correct API routing
  const actualModel = trimmedModel;

  const isOpenRouter = OPENROUTER_FREE_MODELS.includes(trimmedModel) || (trimmedModel.includes(':free') && !isRouteway);

  // Fallback to Pro for execute mode if not using external provider
  let finalModel = actualModel;
  if (mode === 'execute' && !isOpenRouter && !isRouteway && !actualModel.includes('gemini-3-pro')) {
      finalModel = 'gemini-3-pro-preview';
  }

  // Prepend "You are running in Shuper" to ensure model self-awareness
  let updatedSystemInstruction = `You are running in Shuper, an advanced AI workspace.\n${systemInstruction || ''}`;

  if (isOpenRouter || isRouteway) {
      return sendMessageToOpenAICompatible(
          finalMessage, // Pass the processed message containing text attachments
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
            // Explicitly disable thinking to prevent plan-leakage in Explore mode
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
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
];

async function fetchJsonWithRetry(url: string, options: RequestInit, providerName: string): Promise<any> {
    let lastError: any;

    for (const proxyGen of PROXIES) {
        try {
            const proxyUrl = proxyGen(url);
            const response = await fetch(proxyUrl, {
                ...options,
                credentials: 'omit'
            });

            if (!response.ok) {
                 let errText = await response.text().catch(() => '');
                 try {
                    const json = JSON.parse(errText);
                    errText = json.error?.message || json.message || errText;
                 } catch {}
                 throw new Error(`Status ${response.status}: ${errText.slice(0, 100)}`);
            }
            
            return await response.json();
        } catch (e: any) {
            console.warn(`[${providerName}] Proxy failed via ${proxyGen(url).split('?')[0]}`, e);
            lastError = e;
        }
    }
    throw new Error(`${providerName} connection failed. The browser blocked the request (CORS) or the proxy is down.`);
}

/**
 * Searches Scira and returns the results.
 * Can be used for grounding before sending to another model.
 */
export const searchScira = async (
    query: string,
    apiKey: string | undefined
): Promise<string> => {
    if (!apiKey) throw new Error("Scira API Key is missing.");
    if (!query || query.trim().length < 2) throw new Error("Query too short (min 2 chars).");

    const endpoint = 'https://api.scira.ai/api/search';
    
    const body = { 
        messages: [
            { role: 'user', content: query }
        ] 
    };

    try {
        const data = await fetchJsonWithRetry(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Shuper Workspace'
            },
            body: JSON.stringify(body)
        }, 'Scira');

        let formattedText = "";

        if (data.text) {
            formattedText = data.text;
            
            // Append sources if present
            if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
                formattedText += `\n\n---\n**Sources:**\n` + 
                    data.sources.map((s: string) => `- <${s}>`).join('\n');
            }
        } else {
            formattedText = "No structured text returned from Scira.";
        }

        return formattedText;

    } catch (error: any) {
        console.error("Scira API Error:", error);
        throw error;
    }
};

/**
 * Searches Exa and returns the results.
 */
export const searchExa = async (
    query: string,
    apiKey: string | undefined
): Promise<string> => {
    if (!apiKey) throw new Error("Exa API Key is missing.");
    if (!query || query.trim().length < 2) throw new Error("Query too short (min 2 chars).");

    const endpoint = 'https://api.exa.ai/search';

    const body = {
        query: query,
        type: "auto",
        num_results: 10,
        contents: {
            highlights: {
                max_characters: 2000
            }
        }
    };

    try {
        const data = await fetchJsonWithRetry(endpoint, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey.trim(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }, 'Exa');

        let formattedText = "";

        if (data.results && Array.isArray(data.results)) {
            formattedText = data.results.map((r: any, i: number) => {
                const title = r.title || 'Untitled';
                const url = r.url || '#';
                const highlight = r.highlights && r.highlights.length > 0 ? r.highlights[0] : (r.text || 'No snippet available');
                return `**${i + 1}. [${title}](${url})**\n> ${highlight}\n`;
            }).join('\n');
        } else {
            formattedText = "No results returned from Exa.";
        }

        return formattedText;

    } catch (error: any) {
        console.error("Exa API Error:", error);
        throw error;
    }
};

/**
 * Searches Tavily and returns the results.
 */
export const searchTavily = async (
    query: string,
    apiKey: string | undefined
): Promise<string> => {
    if (!apiKey) throw new Error("Tavily API Key is missing.");
    if (!query || query.trim().length < 2) throw new Error("Query too short (min 2 chars).");

    const endpoint = 'https://api.tavily.com/search';
    
    const body = {
        query: query,
        topic: "general",
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
        include_raw_content: false
    };

    try {
        const data = await fetchJsonWithRetry(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify(body)
        }, 'Tavily');

        let formattedText = "";

        if (data.answer) {
            formattedText += `**Direct Answer:**\n${data.answer}\n\n---\n`;
        }

        if (data.results && Array.isArray(data.results)) {
            formattedText += data.results.map((r: any, i: number) => {
                const title = r.title || 'Untitled';
                const url = r.url || '#';
                const content = r.content || 'No snippet available';
                return `**${i + 1}. [${title}](${url})**\n> ${content}\n`;
            }).join('\n');
        } else {
            formattedText += "No detailed results returned from Tavily.";
        }

        return formattedText;

    } catch (error: any) {
        console.error("Tavily API Error:", error);
        throw error;
    }
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
    // Logic to detect provider.
    const isRouteway = ROUTEWAY_MODELS.includes(trimmedModel);

    let fullUrl = '';
    
    if (isRouteway) {
        fullUrl = 'https://api.routeway.ai/v1/chat/completions';
    } else {
        fullUrl = 'https://openrouter.ai/api/v1/chat/completions';
    }

    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });

    history.forEach(h => {
        // Concatenate text parts
        const content = h.parts.filter(p => p.text).map(p => p.text).join(' ');
        if (content.trim()) {
            messages.push({ role: h.role === 'model' ? 'assistant' : 'user', content });
        }
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
        let keyToTry = '';
        if (isRouteway) keyToTry = apiKeys.routeway;
        else keyToTry = apiKeys.openRouter;

        if (!keyToTry && !isRouteway && apiKeys.openRouterAlt) {
            keyToTry = apiKeys.openRouterAlt; // Use alt if primary missing for OpenRouter
        }

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
