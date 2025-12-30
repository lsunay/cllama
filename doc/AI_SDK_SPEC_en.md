# AI SDK Specification (v2.0)

This document defines the standard interface and behavioral specifications for the AI Service Client SDK. It aims to ensure that implementations for different AI backends (e.g., Ollama, OpenAI) have a unified and predictable API, facilitating frontend integration and replacement.

## Core Design Principles

1.  **Asynchronous and Event-Driven**: All network requests are asynchronous operations. The response lifecycle is handled through callback functions (`onStart`, `onStream`, `onComplete`, `onError`).
2.  **Session Isolation**: Each `sendRequest` call creates an independent session, identified and managed via a unique `sessionId`.
3.  **Streaming First**: The SDK design enforces or prioritizes streaming responses to provide the best user experience.
4.  **Controllability**: Reliable request termination mechanisms (`abort` and `abortAllSessions`) must be provided to allow users to interrupt ongoing AI generation tasks.
5.  **Error Handling**: Errors are handled via the `onError` callback and/or by throwing exceptions, and should include as much detailed context as possible.

---

## Interface Specification

### `constructor(config)`

Initializes the client instance.

-   **Parameters**:
    -   `config` (`object`): Configuration object.
        -   `endpoint` (`string`): **Required**. The API endpoint URL of the AI service.
        -   `apiKey` (`string`): **Optional**. API key for authentication, required by some services (e.g., OpenAI).
        -   `defaultModel` (`string`): **Optional**. The default model ID to use when no model is specified.
        -   `service` (`string`): **Optional**. Used to identify specific service types (e.g., `"ZhiPu"`, `"Google"`) for special handling.

-   **Behavior**:
    -   Must validate that `endpoint` exists; otherwise, throw an error.
    -   Store the configuration for use in subsequent methods.

### `async getModels(forceRefresh = false)`

Fetches and returns the list of models supported by the service.

-   **Parameters**:
    -   `forceRefresh` (`boolean`): **Optional**. Defaults to `false`. If `true`, ignores cache and forces a re-fetch from the server.
-   **Returns**: `Promise<string[]>` - Resolves to an array containing model ID strings.
-   **Behavior**:
    -   Implementations should cache the model list to avoid unnecessary network requests.
    -   If the request fails, it should throw a descriptive error.

### `async sendRequest(messages, options = {})`

Sends a chat request and handles the response.

-   **Parameters**:
    -   `messages` (`object[]`): **Required**. An array of objects representing the conversation history.
        -   Format for each object: `{ role: 'user' | 'assistant' | 'system', content: '...' }`
    -   `options` (`object`): **Optional**. Contains detailed configuration for the request.
        -   `model` (`string`): The model ID to use for this request. If not provided, `defaultModel` is used.
        -   `onStart(sessionId)` (`function`): Called immediately when the request starts, returning the generated unique `sessionId`.
        -   `onStream(chunk, fullText, sessionId)` (`function`): Called for each chunk of the data stream received.
            -   `chunk`: The current text fragment received.
            -   `fullText`: The concatenated full text received so far.
            -   `sessionId`: The current session ID.
        -   `onComplete(fullResponse, sessionId)` (`function`): Called when the stream ends and the request completes successfully.
        -   `onError(error, sessionId)` (`function`): Called when a network or API error occurs.
        -   `temperature` (`number`): Controls the randomness of the model output, typically ranging from 0 to 2.
        -   `options` (`object`): A container for passing proprietary parameters specific to the backend (e.g., `num_ctx` for Ollama).

-   **Returns**: `Promise<string>` - Resolves to the `sessionId` for this request.

### `abort(sessionId)`

Terminates an ongoing request.

-   **Parameters**:
    -   `sessionId` (`string`): **Required**. The ID of the session to terminate.
-   **Returns**: `boolean` - Returns `true` if the session exists and a termination signal was successfully sent; otherwise `false`.

### `abortAllSessions()`

Terminates all ongoing requests.

-   **Returns**: `number` - The number of sessions successfully terminated.

---

## Best Practices

-   **Implement `AbortController`**: `abort()` and `abortAllSessions()` should use `AbortController` internally to cancel `fetch` requests.
-   **Session Cleanup**: After a request completes (`onComplete`) or fails (`onError`), the corresponding `sessionId` must be removed from internal session management (e.g., an `activeSessions` Map).
-   **Parameter Validation**: Perform basic format validation on critical inputs like `messages`.
-   **Logging**: Add console logs at key steps (e.g., request failure, parsing errors) to facilitate debugging.
