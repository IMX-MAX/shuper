
import { GoogleGenAI, Type } from "@google/genai";
import { Attachment, OPENROUTER_FREE_MODELS, SessionMode, UserSettings, Label, ROUTEWAY_MODELS } from "../types";

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
  const isOpenRouter = OPENROUTER_FREE_MODELS.includes(trimmedModel) || trimmedModel.includes(':free') && !ROUTEWAY_MODELS.includes(trimmedModel);
  const isRouteway = ROUTEWAY_MODELS.includes(trimmedModel);

  let actualModel = trimmedModel;
  if (mode === 'execute' && !isOpenRouter && !isRouteway) {
      actualModel = 'gemini-3-pro-preview';
  }

  // Prepend "You are running in Shuper" to ensure model self-awareness
  const updatedSystemInstruction = `You are running in Shuper, an advanced AI workspace.\n${systemInstruction || ''}`;

  if (isOpenRouter || isRouteway) {
      return sendMessageToOpenAICompatible(
          message, 
          history, 
          updatedSystemInstruction, 
          useThinking, 
          onUpdate, 
          apiKeys, 
          actualModel,
          signal
      );
  }

  const geminiKey = apiKeys?.gemini || process.env.API_KEY;
  if (!geminiKey) return { text: "Missing Gemini API Key. Please add it in Settings." };

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  
  try {
    const currentParts: any[] = [];
    if (message && message.trim()) currentParts.push({ text: message });
    
    attachments.forEach(att => {
        const base64Data = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
        currentParts.push({
            inlineData: {
                mimeType: att.type,
                data: base64Data
            }
        });
    });

    if (currentParts.length === 0) currentParts.push({ text: " " });

    const config: any = {
        systemInstruction: updatedSystemInstruction.trim() || undefined,
    };

    const isThinkingSupported = actualModel.includes('gemini-3') || actualModel.includes('gemini-2.5');

    if (isThinkingSupported) {
        if (mode === 'execute') {
            config.thinkingConfig = { thinkingBudget: 32768 }; 
        } else {
            // Explicitly disable thinking to prevent plan-leakage in Explore mode
            config.thinkingConfig = { thinkingBudget: 0 };
        }
    }

    const responseStream = await ai.models.generateContentStream({
      model: actualModel,
      contents: [...history, { role: 'user', parts: currentParts }],
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

    let fullUrl = '';
    const trimmedModel = modelName.trim();
    
    if (ROUTEWAY_MODELS.includes(trimmedModel)) {
        fullUrl = 'https://api.routeway.ai/v1/chat/completions';
    } else {
        fullUrl = 'https://openrouter.ai/api/v1/chat/completions';
    }

    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });

    history.forEach(h => {
        const content = h.parts.map(p => p.text).join(' ');
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
        if (ROUTEWAY_MODELS.includes(trimmedModel)) keyToTry = apiKeys.routeway;
        else keyToTry = apiKeys.openRouter;

        if (!keyToTry && !ROUTEWAY_MODELS.includes(trimmedModel) && apiKeys.openRouterAlt) {
            keyToTry = apiKeys.openRouterAlt; // Use alt if primary missing for OpenRouter
        }

        if (!keyToTry) throw new Error(`API Key for ${modelName} missing.`);

        let response = await tryFetch(keyToTry);

        if (response.status === 429 && !ROUTEWAY_MODELS.includes(trimmedModel) && apiKeys.openRouterAlt && keyToTry !== apiKeys.openRouterAlt) {
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
                    const content = json.choices[0]?.delta?.content || '';
                    if (content) {
                        fullText += content;
                        if (onUpdate) onUpdate(fullText);
                    }
                } catch (e) {}
            }
        }
        return { text: fullText };
    } catch (error: any) {
        if (error.name === 'AbortError') return { text: "[Stopped by user]" };
        console.error(`${trimmedModel} API Error:`, error);
        return { text: `${error.message || "Failed to communicate with provider API"}` };
    }
};
