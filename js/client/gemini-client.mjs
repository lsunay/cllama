import { GoogleGenAI } from './gemini.mjs';

export class GeminiClient {
    constructor(config) {
        if (!config || !config.endpoint) {
            throw new Error('GeminiClient: endpoint is required in config.');
        }
        this.config = { ...config };
        this.apiClient = new GoogleGenAI({
            apiKey: this.config.apiKey,
            // Assuming endpoint can be directly used as baseUrl for GoogleGenAI
            httpOptions: { baseUrl: this.config.endpoint },
            // Vertex AI is false by default, assuming Gemini API for now
            vertexai: this.config.service === 'Google' ? false : false, // Adjust if Vertex AI is needed
        });
        this.activeSessions = new Map();
        this.modelCache = null;
    }

    async getModels(forceRefresh = false) {
        //if (this.modelCache && !forceRefresh) {
        //    return this.modelCache;
        //}

        try {
            const listModelsResponse = await this.apiClient.models.list();
            const modelsArray = listModelsResponse.pageInternal || listModelsResponse.models || (Array.isArray(listModelsResponse) ? listModelsResponse : null);

            if (!modelsArray) {
                console.error('Unexpected response structure for models:', listModelsResponse);
                throw new Error('Failed to fetch models: Unexpected response structure.');
            }

            const models = modelsArray
                .filter(model => model.supportedActions && model.supportedActions.includes('generateContent'))
                .map(model => model.name.replace(/^models\//, ''));

            this.modelCache = models;
            return models;    
        } catch (error) {
            console.error('Error fetching models:', error);
            throw new Error(`Failed to fetch models: ${error.message || error}`);
        }
    }

    async sendRequest(messages, options = {}) {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const abortController = new AbortController();
        this.activeSessions.set(sessionId, abortController);

        const model = options.model || this.config.defaultModel;
        if (!model) {
            throw new Error('GeminiClient: model must be specified or a defaultModel must be configured.');
        }

        const generationConfig = {
            temperature: options.temperature,
            maxOutputTokens: options.maxOutputTokens, // Assuming this is a valid option
            stopSequences: options.stopSequences, // Assuming this is a valid option
            topP: options.topP, // Assuming this is a valid option
            topK: options.topK, // Assuming this is a valid option
            // Add other options from AI_SDK_SPEC.md if they map directly to Gemini API
        };

        // Filter out undefined values from generationConfig
        Object.keys(generationConfig).forEach(key => generationConfig[key] === undefined && delete generationConfig[key]);

        const requestParams = {
            model: model,
            contents: messages.map(msg => ({ role: msg.role, parts: msg.parts || [{ text: msg.content }] })),
            config: {
                ...options.options, // Pass backend-specific options
                ...generationConfig,
                httpOptions: {
                    abortSignal: abortController.signal,
                },
            },
        };

        if (options.onStart) {
            options.onStart(sessionId);
        }

        let fullText = '';
        try {
            const stream = await this.apiClient.models.generateContentStream(requestParams);
            for await (const chunk of stream) {
                const chunkText = chunk.text || '';
                fullText += chunkText;
                if (options.onStream) {
                    options.onStream(chunkText, fullText, sessionId);
                }
            }
            if (options.onComplete) {
                options.onComplete(fullText, sessionId);
            }
            return sessionId;
        } catch (error) {
            if (options.onError) {
                options.onError(error, sessionId);
            }
            throw error;
        } finally {
            this.activeSessions.delete(sessionId);
        }
    }

    abort(sessionId) {
        const controller = this.activeSessions.get(sessionId);
        if (controller) {
            controller.abort();
            this.activeSessions.delete(sessionId);
            return true;
        }
        return false;
    }

    abortAllSessions() {
        let abortedCount = 0;
        for (const [sessionId, controller] of this.activeSessions.entries()) {
            controller.abort();
            this.activeSessions.delete(sessionId);
            abortedCount++;
        }
        return abortedCount;
    }
}
