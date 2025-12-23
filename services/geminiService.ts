import { GoogleGenAI } from "@google/genai";
import { AISettings } from "../types";

// Helper to get settings from local storage
const getSettings = (): AISettings => {
  const saved = localStorage.getItem('flowspace_ai_settings');
  if (saved) return JSON.parse(saved);
  // Default fallback (user needs to configure this)
  return { provider: 'gemini', apiKey: '', model: 'gemini-3-flash-preview' };
};

// Generic handler for AI generation
const generateAIResponse = async (
    systemPrompt: string, 
    userPrompt: string, 
    jsonMode: boolean = false,
    useSearch: boolean = false
): Promise<string> => {
    const settings = getSettings();

    // --- Gemini Handler ---
    if (settings.provider === 'gemini') {
        const apiKeyToUse = process.env.API_KEY || settings.apiKey;
        if (!apiKeyToUse) throw new Error("API Key not found. Please check settings.");

        const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
        const modelName = settings.model || 'gemini-3-flash-preview';
        
        try {
            const config: any = {
                systemInstruction: systemPrompt,
                responseMimeType: jsonMode ? "application/json" : "text/plain",
            };

            // Enable Google Search for real-time data if requested
            if (useSearch) {
                config.tools = [{ googleSearch: {} }];
            }

            const response = await ai.models.generateContent({
                model: modelName,
                contents: userPrompt,
                config: config,
            });
            return response.text || "";
        } catch (error: any) {
            console.error("Gemini API Error:", error);
            throw new Error(error.message || "Failed to call Gemini API");
        }
    } 
    
    // --- OpenAI / DeepSeek Handler (Compatible API) ---
    else {
        if (!settings.apiKey) {
            throw new Error(`API Key for ${settings.provider} is missing. Please configure it in Settings.`);
        }

        let baseUrl = settings.baseUrl;
        let defaultModel = 'gpt-3.5-turbo';

        if (settings.provider === 'deepseek') {
            baseUrl = baseUrl || 'https://api.deepseek.com';
            defaultModel = 'deepseek-chat';
        } else {
            // OpenAI
            baseUrl = baseUrl || 'https://api.openai.com/v1';
        }

        // Ensure clean URL
        const url = `${baseUrl?.replace(/\/+$/, '')}/chat/completions`;
        const model = settings.model || defaultModel;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    response_format: jsonMode ? { type: "json_object" } : undefined,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API Error (${response.status}): ${errorData}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (error: any) {
             console.error(`${settings.provider} API Error:`, error);
             throw new Error(error.message || `Failed to call ${settings.provider} API`);
        }
    }
};

export const analyzeCodeSnippet = async (code: string, context: string): Promise<string> => {
  try {
    const systemPrompt = `You are an expert Senior Frontend Engineer and Debugger. Provide a concise diagnosis, security check, and optimized solution in Markdown. Please use Simplified Chinese (简体中文) for the explanation.`;
    const userPrompt = `Context: ${context}\n\nCode/Log:\n\`\`\`\n${code}\n\`\`\``;

    return await generateAIResponse(systemPrompt, userPrompt);
  } catch (error: any) {
    return `Analysis Failed: ${error.message}`;
  }
};

export const generateInspirationIdea = async (): Promise<{ title: string; description: string; tags: string[] }> => {
    try {
        const systemPrompt = `You are a creative web design assistant. Output language must be Simplified Chinese (简体中文).`;
        const userPrompt = `Generate a unique, modern web component idea for a developer's inspiration board. Return ONLY a valid JSON object with 'title', 'description', and an array of 'tags'.`;
        
        const text = await generateAIResponse(systemPrompt, userPrompt, true);
        return JSON.parse(text);
    } catch (e) {
        console.error("Generation Error:", e);
        return {
            title: "配置需要",
            description: "请在设置中配置您的 API 密钥以生成创意。",
            tags: ["设置", "配置"]
        };
    }
}

export const generateDraftOutline = async (content: string): Promise<{ title: string; outline: string; tags: string[] }> => {
    try {
        const systemPrompt = `You are an expert content strategist. Output language must be Simplified Chinese (简体中文).`;
        const userPrompt = `Analyze this input (link/snippet/idea) and generate a 'Creation Directory' (blog outline). Input: "${content}". Return JSON with 'title', 'outline' (markdown bullet points in Chinese), and 'tags' (array of 3 strings in Chinese).`;

        const text = await generateAIResponse(systemPrompt, userPrompt, true);
        return JSON.parse(text);
    } catch (e) {
        console.error("Gemini Outline Error:", e);
        return {
            title: "草稿 (离线)",
            outline: "- 连接 AI 失败。\n- 请在设置中检查 API Key。",
            tags: ["错误", "离线"]
        };
    }
};

export const analyzeUrlContent = async (url: string): Promise<{ title: string; summary: string; tags: string[] }> => {
    try {
        const systemPrompt = `You are a sophisticated web content analyst. Your goal is to analyze URLs and provide a concise summary in Simplified Chinese (简体中文).`;
        const userPrompt = `Analyze this URL: "${url}". 
        
        Provide a structured JSON response with:
        1. 'title': A catchy, relevant title for this resource (in Chinese).
        2. 'summary': A concise 2-3 sentence summary of what this page likely contains or solves (in Chinese).
        3. 'tags': An array of 3-5 relevant technical or category tags (in Chinese).
        
        Return ONLY valid JSON.`;

        // We use search here to allow the model to potentially 'visit' the page if it can, or at least search for its context
        const text = await generateAIResponse(systemPrompt, userPrompt, true, true);
        return JSON.parse(text);
    } catch (e) {
        console.error("URL Analysis Error:", e);
        return {
            title: "新链接资源",
            summary: "无法自动分析链接。请检查 API 设置。",
            tags: ["链接", "未处理"]
        };
    }
};

/**
 * DIRECT API FETCHING (Bypasses AI/Google)
 */
export const fetchGithubTrendingDirectly = async (): Promise<{ items: { title: string; description: string; tags: string[]; searchTerm: string; img?: string }[] }> => {
    try {
        // Calculate date for "Last 7 days" to get trending items
        const date = new Date();
        date.setDate(date.getDate() - 7);
        const dateString = date.toISOString().split('T')[0];
        
        const response = await fetch(`https://api.github.com/search/repositories?q=created:>${dateString}&sort=stars&order=desc&per_page=6`);
        
        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status}`);
        }

        const data = await response.json();
        
        const items = data.items.map((repo: any) => ({
            title: repo.full_name, // e.g., facebook/react
            description: `${repo.description || 'No description provided.'} (⭐ ${repo.stargazers_count})`,
            tags: [repo.language || 'Code', ...repo.topics?.slice(0, 2) || []],
            searchTerm: repo.full_name, // Used for direct linking
            img: repo.owner.avatar_url // Use owner avatar
        }));

        return { items };
    } catch (error) {
        console.error("GitHub Direct Fetch Error:", error);
        throw error;
    }
};


// New function for Fetching Trends based on Category
export const getTrendingInspiration = async (category: string, query?: string): Promise<{ items: { title: string; description: string; tags: string[]; searchTerm: string }[] }> => {
    try {
        const settings = getSettings();
        const now = new Date().toLocaleString('zh-CN', { dateStyle: 'full', timeStyle: 'short', hour12: false });
        
        let systemPrompt = '';

        // --- Provider Specific Prompting ---
        if (settings.provider === 'gemini') {
            // Gemini (Has Real-time Search Capability via Tools)
            systemPrompt = `You are a Real-time Trend Analyzer for Chinese Social Media and Global Tech.
            Output language must be Simplified Chinese (简体中文).
            
            CURRENT SYSTEM TIME: ${now}.
            
            Your Goal: Provide the ACTUAL, REAL-TIME viral topics for this exact moment.
            
            INSTRUCTIONS:
            1. You MUST use Google Search to find the latest Hot Search List (热搜榜) for the requested platform.
            2. DO NOT use old or hallucinated data from 2024 or earlier unless it is actually trending TODAY (${now}).
            3. If the category is 'Douyin', 'Weibo', or 'RedBook', specifically search for "微博热搜榜", "抖音热点榜", etc., followed by the current date.
            
            Return a JSON object with a property 'items' containing an array of 6 items.
            `;
        } else {
            // OpenAI / DeepSeek (Likely NO Real-time Search Capability in this implementation)
            // We adjust instructions to avoid "I can't browse" errors
            systemPrompt = `You are a Trend Analyzer for Chinese Social Media and Global Tech.
            Output language must be Simplified Chinese (简体中文).
            
            CURRENT SYSTEM TIME: ${now}.
            
            Your Goal: Provide HIGHLY RELEVANT and LIKELY viral topics for this category.
            
            INSTRUCTIONS:
            1. Since you do not have real-time browser access, generate realistic, high-quality, and popular trends relevant to the category based on your knowledge.
            2. Focus on evergreen hot topics, recent major tech events, or standard viral content formats for the specific platform.
            3. Do NOT mention that you cannot browse the internet. Just provide the best estimated data.
            
            Return a JSON object with a property 'items' containing an array of 6 items.
            `;
        }

        const context = query 
            ? `User Search Query: "${query}".`
            : `Target Platform/Category: "${category}".`;

        const userPrompt = `${context}
        
        Each item must have:
        - 'title': The topic name.
        - 'description': Brief context and heat metric (e.g. "High Attention").
        - 'tags': Array of 2-3 tags.
        - 'searchTerm': The exact keyword to search on the engine.

        Ensure the output is valid JSON.`;

        // Enable Search (4th argument = true). 
        // Note: verify logic in generateAIResponse only attaches tools if provider is gemini.
        const text = await generateAIResponse(systemPrompt, userPrompt, true, true);
        return JSON.parse(text);
    } catch (e) {
        console.error("Trending Error:", e);
        return { items: [] }; // Return empty to handle gracefully in UI
    }
}