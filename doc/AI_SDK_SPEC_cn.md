# AI SDK 规范文档 (v2.0)

本文档定义了 AI 服务客户端 SDK 的标准接口和行为规范，旨在确保不同 AI 后端（如 Ollama, OpenAI）的实现具有统一、可预测的 API，便于前端集成和替换。

## 核心设计原则

1.  **异步与事件驱动**: 所有网络请求均为异步操作，通过回调函数（`onStart`, `onStream`, `onComplete`, `onError`）处理响应生命周期。
2.  **会话隔离**: 每个 `sendRequest` 调用都创建一个独立的会话，通过唯一的 `sessionId` 进行标识和管理。
3.  **流式优先**: SDK 设计强制或优先使用流式响应（streaming），以提供最佳的用户体验。
4.  **可控性**: 必须提供可靠的请求终止机制（`abort` 和 `abortAllSessions`），允许用户中断正在进行的 AI 生成任务。
5.  **错误处理**: 错误通过 `onError` 回调和/或抛出异常进行处理，并应包含尽可能详细的上下文信息。

---

## 接口规范

### `constructor(config)`

初始化客户端实例。

-   **参数**:
    -   `config` (`object`): 配置对象。
        -   `endpoint` (`string`): **必需**。AI 服务的 API 端点 URL。
        -   `apiKey` (`string`): **可选**。用于身份验证的 API 密钥，某些服务（如 OpenAI）需要。
        -   `defaultModel` (`string`): **可选**。未指定模型时使用的默认模型 ID。
        -   `service` (`string`): **可选**。用于识别特定服务类型（如 `"ZhiPu"`, `"Google"`），以便进行特殊处理。

-   **行为**:
    -   必须验证 `endpoint` 是否存在，否则抛出错误。
    -   存储配置以供后续方法使用。

### `async getModels(forceRefresh = false)`

获取并返回服务支持的模型列表。

-   **参数**:
    -   `forceRefresh` (`boolean`): **可选**。默认为 `false`。若为 `true`，则忽略缓存，强制从服务器重新获取。
-   **返回值**: `Promise<string[]>` - 解析为一个包含模型 ID 字符串的数组。
-   **行为**:
    -   实现应缓存模型列表以避免不必要的网络请求。
    -   如果请求失败，应抛出一个描述性错误。

### `async sendRequest(messages, options = {})`

发送聊天请求并处理响应。

-   **参数**:
    -   `messages` (`object[]`): **必需**。一个对象数组，表示对话历史。
        -   每个对象格式: `{ role: 'user' | 'assistant' | 'system', content: '...' }`
    -   `options` (`object`): **可选**。包含请求的详细配置。
        -   `model` (`string`): 本次请求使用的模型 ID。如果未提供，则使用 `defaultModel`。
        -   `onStart(sessionId)` (`function`): 请求开始时立即调用，返回生成的唯一 `sessionId`。
        -   `onStream(chunk, fullText, sessionId)` (`function`): 接收到数据流的每个片段时调用。
            -   `chunk`: 当前收到的文本片段。
            -   `fullText`: 已拼接的完整文本。
            -   `sessionId`: 当前会话 ID。
        -   `onComplete(fullResponse, sessionId)` (`function`): 流结束且请求成功完成时调用。
        -   `onError(error, sessionId)` (`function`): 发生网络或 API 错误时调用。
        -   `temperature` (`number`): 控制模型输出的随机性，范围通常为 0 到 2。
        -   `options` (`object`): 一个用于传递特定于后端的专有参数的容器（例如 Ollama 的 `num_ctx`）。

-   **返回值**: `Promise<string>` - 解析为本次请求的 `sessionId`。

### `abort(sessionId)`

终止一个正在进行的请求。

-   **参数**:
    -   `sessionId` (`string`): **必需**。要终止的会话 ID。
-   **返回值**: `boolean` - 如果会话存在并成功发出终止信号，则返回 `true`；否则返回 `false`。

### `abortAllSessions()`

终止所有正在进行的请求。

-   **返回值**: `number` - 成功终止的会话数量。

---

## 最佳实践

-   **实现 `AbortController`**: `abort()` 和 `abortAllSessions()` 的底层应使用 `AbortController` 来取消 `fetch` 请求。
-   **会话清理**: 在请求完成（`onComplete`）或失败（`onError`）后，必须从内部会话管理中（如 `activeSessions` Map）移除对应的 `sessionId`。
-   **参数验证**: 对 `messages` 等关键输入进行基本的格式验证。
-   **日志记录**: 在关键步骤（如请求失败、解析错误）添加控制台日志，方便调试。
