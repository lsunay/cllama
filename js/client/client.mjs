import { ChatGPTClient } from './chatgpt-client.mjs';
import { OllamaClient } from './ollama-client.mjs';
import { GeminiClient } from './gemini-client.mjs';
import { isGemini } from '../util.js';

// Internal cache to store initialized client instances to avoid redundant creation.
const serviceCache = new Map();

/**
 * Internal factory function to create a client instance based on the configuration.
 * Centralizes the creation logic to ensure consistency between getService and getServiceInstance.
 * * @param {Object} config - The configuration object containing service details.
 * @returns {Object} A new instance of the specific client.
 */
function createClient(config) {
    const { service, apiUrl: endpoint, apiKey, modelName: defaultModel } = config;
    // Use "-" as a fallback if apiKey is missing, common for local or self-hosted services.
    const safeApiKey = apiKey || "-"; 

    // 1. Check for OpenAI-compatible endpoints (often used by various providers)
    if (endpoint && endpoint.endsWith("chat/completions")) {
        return new ChatGPTClient({ 
            service, 
            endpoint, 
            apiKey: safeApiKey, 
            defaultModel 
        });
    }

    // 2. Check for Ollama specific service
    if (service === "ollama") {
        return new OllamaClient({ endpoint, defaultModel });
    }

    // 3. Check for Gemini service using the utility function
    if (isGemini(config)) {
        return new GeminiClient({ 
            service, 
            endpoint, 
            apiKey: safeApiKey, 
            defaultModel 
        });
    }

    throw new Error(`Unsupported service or configuration: ${service}`);
}

/**
 * Retrieves a cached service instance or creates a new one if it doesn't exist.
 * Uses a composite key to ensure uniqueness for different configurations.
 * * @param {Object} runtimeConfig - Configuration for the service.
 * @returns {Object} The client instance.
 */
export function getServiceInstance(runtimeConfig) {
    // Generate a unique cache key combining service name and endpoint.
    // This prevents collisions if the same service name is used with different URLs.
    const cacheKey = `${runtimeConfig.service}|${runtimeConfig.apiUrl}`;

    // Return cached instance if it exists
    if (serviceCache.has(cacheKey)) {
        return serviceCache.get(cacheKey);
    }

    // Create new instance and store it in cache
    const newInstance = createClient(runtimeConfig);
    serviceCache.set(cacheKey, newInstance);

    return newInstance;
}

/**
 * Legacy or direct accessor to get a service instance without caching logic.
 * Wraps parameters into a config object to reuse the central createClient logic.
 * * @param {string} service - The service name.
 * @param {string} apiUrl - The API endpoint URL.
 * @param {string} apiKey - The API key.
 * @returns {Object} The client instance.
 */
export function getService(service, apiUrl, apiKey) {
    // Construct a config object to reuse the unified factory logic
    const config = {
        service,
        apiUrl,
        apiKey
    };
    
    return createClient(config);
}