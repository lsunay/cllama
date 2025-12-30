/**
 * AI Service SDK Standard Specification (v2.0)
 * All AI SDK implementations must follow this interface specification to ensure compatibility and scalability of frontend applications.
 * This specification is abstracted and standardized based on existing implementations of Ollama and OpenAI ChatGPT.
 */
class AIClientInterface {
  /**
   * Constructor: Initializes the AI service client
   * @param {object} config - Configuration object
   * @param {string} config.endpoint - API endpoint of the AI service (Required)
   * @param {string} [config.apiKey] - API key (Optional, required by specific services)
   * @param {string} [config.defaultModel] - Default model ID to use (Optional)
   * @param {string} [config.service] - Service type identifier (Optional, used for specific logic handling)
   */
  constructor(config) {
    if (!config || !config.endpoint) {
      throw new Error('Configuration object with "endpoint" is required.');
    }
  }

  /**
   * Fetches and returns the list of models supported by the current service
   * @param {boolean} [forceRefresh=false] - If true, forces a re-fetch from the server, ignoring cache
   * @returns {Promise<string[]>} - A promise that resolves to an array of model ID strings
   * @throws {Error} - Throws an error when the model list cannot be retrieved
   */
  async getModels(forceRefresh = false) {
    throw new Error('getModels() must be implemented.');
  }

  /**
   * Sends a chat request to the AI service
   * @param {object[]} messages - Chat message history
   *   Format: [{ role: 'user'|'assistant'|'system', content: string }]
   * @param {object} [options={}] - Configuration options for the request
   * @param {string} [options.model] - The model ID to use for this request, defaults to defaultModel if not provided
   * 
   * // --- Callback Functions ---
   * @param {function(sessionId: string): void} [options.onStart] - Called when the request starts, returns the session ID
   * @param {function(chunk: string, fullText: string, sessionId: string): void} [options.onStream] - Called when a data chunk is received in a streaming response
   * @param {function(fullResponse: string, sessionId: string): void} [options.onComplete] - Called when the request succeeds and all data has been received
   * @param {function(error: Error, sessionId: string): void} [options.onError] - Called when an error occurs during the request process
   * 
   * // --- Other General Parameters ---
   * @param {number} [options.temperature] - Controls the randomness of the generated text (0-2)
   * @param {object} [options.options] - Used to pass additional parameters specific to the AI provider (e.g., num_ctx for Ollama)
   * 
   * @returns {Promise<string>} - Returns a Promise that resolves to the unique session ID (sessionId) for this request
   * @throws {Error} - Throws an error if the request cannot be started or a critical error occurs
   */
  async sendRequest(messages, options = {}) {
    throw new Error('sendRequest() must be implemented.');
  }

  /**
   * Terminates an ongoing chat request
   * @param {string} sessionId - The session ID returned by onStart or sendRequest
   * @returns {boolean} - Returns true if the session was successfully found and termination was attempted; otherwise false
   */
  abort(sessionId) {
    throw new Error('abort() must be implemented.');
  }

  /**
   * Terminates all currently ongoing chat requests
   * @returns {number} - The number of sessions successfully terminated
   */
  abortAllSessions() {
    throw new Error('abortAllSessions() must be implemented.');
  }
}
