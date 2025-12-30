# AI SDK-Spezifikation (v2.0)

Dieses Dokument definiert die Standardschnittstelle und die Verhaltensspezifikationen für das AI Service Client SDK. Ziel ist es, sicherzustellen, dass Implementierungen für verschiedene AI-Backends (z. B. Ollama, OpenAI) eine einheitliche und vorhersehbare API aufweisen, was die Integration und den Austausch im Frontend erleichtert.

## Kerndesignprinzipien

1.  **Asynchron und ereignisgesteuert**: Alle Netzwerkanfragen sind asynchrone Operationen. Der Lebenszyklus der Antwort wird über Callback-Funktionen (`onStart`, `onStream`, `onComplete`, `onError`) abgewickelt.
2.  **Sitzungsisolation**: Jeder `sendRequest`-Aufruf erstellt eine unabhängige Sitzung, die über eine eindeutige `sessionId` identifiziert und verwaltet wird.
3.  **Streaming First**: Das SDK-Design erzwingt oder priorisiert Streaming-Antworten, um das beste Benutzererlebnis zu bieten.
4.  **Steuerbarkeit**: Zuverlässige Mechanismen zum Abbruch von Anfragen (`abort` und `abortAllSessions`) müssen bereitgestellt werden, damit Benutzer laufende AI-Generierungsaufgaben unterbrechen können.
5.  **Fehlerbehandlung**: Fehler werden über den `onError`-Callback und/oder durch das Auslösen von Ausnahmen behandelt und sollten so viele detaillierte Kontextinformationen wie möglich enthalten.

---

## Schnittstellenspezifikation

### `constructor(config)`

Initialisiert die Client-Instanz.

-   **Parameter**:
    -   `config` (`object`): Konfigurationsobjekt.
        -   `endpoint` (`string`): **Erforderlich**. Die API-Endpunkt-URL des AI-Dienstes.
        -   `apiKey` (`string`): **Optional**. API-Schlüssel für die Authentifizierung, wird von einigen Diensten (z. B. OpenAI) benötigt.
        -   `defaultModel` (`string`): **Optional**. Die Standard-Modell-ID, die verwendet werden soll, wenn kein Modell angegeben ist.
        -   `service` (`string`): **Optional**. Wird verwendet, um bestimmte Diensttypen (z. B. `"ZhiPu"`, `"Google"`) für eine spezielle Handhabung zu identifizieren.

-   **Verhalten**:
    -   Muss überprüfen, ob `endpoint` vorhanden ist; andernfalls wird ein Fehler ausgelöst.
    -   Speichert die Konfiguration für die Verwendung in nachfolgenden Methoden.

### `async getModels(forceRefresh = false)`

Ruft die Liste der vom Dienst unterstützten Modelle ab und gibt sie zurück.

-   **Parameter**:
    -   `forceRefresh` (`boolean`): **Optional**. Standardmäßig `false`. Wenn `true`, wird der Cache ignoriert und ein erneuter Abruf vom Server erzwungen.
-   **Rückgabewert**: `Promise<string[]>` - Wird in ein Array mit Modell-ID-Strings aufgelöst.
-   **Verhalten**:
    -   Implementierungen sollten die Modellliste zwischenspeichern, um unnötige Netzwerkanfragen zu vermeiden.
    -   Wenn die Anfrage fehlschlägt, sollte ein aussagekräftiger Fehler ausgelöst werden.

### `async sendRequest(messages, options = {})`

Sendet eine Chat-Anfrage und verarbeitet die Antwort.

-   **Parameter**:
    -   `messages` (`object[]`): **Erforderlich**. Ein Array von Objekten, die den Konversationsverlauf darstellen.
        -   Format für jedes Objekt: `{ role: 'user' | 'assistant' | 'system', content: '...' }`
    -   `options` (`object`): **Optional**. Enthält detaillierte Konfigurationen für die Anfrage.
        -   `model` (`string`): Die Modell-ID, die für diese Anfrage verwendet werden soll. Wenn nicht angegeben, wird `defaultModel` verwendet.
        -   `onStart(sessionId)` (`function`): Wird sofort beim Start der Anfrage aufgerufen und gibt die generierte eindeutige `sessionId` zurück.
        -   `onStream(chunk, fullText, sessionId)` (`function`): Wird für jedes empfangene Segment des Datenstroms aufgerufen.
            -   `chunk`: Das aktuell empfangene Textfragment.
            -   `fullText`: Der bisher verkettete vollständige Text.
            -   `sessionId`: Die aktuelle Sitzungs-ID.
        -   `onComplete(fullResponse, sessionId)` (`function`): Wird aufgerufen, wenn der Stream endet und die Anfrage erfolgreich abgeschlossen wurde.
        -   `onError(error, sessionId)` (`function`): Wird aufgerufen, wenn ein Netzwerk- oder API-Fehler auftritt.
        -   `temperature` (`number`): Steuert die Zufälligkeit der Modellausgabe, normalerweise im Bereich von 0 bis 2.
        -   `options` (`object`): Ein Container zur Übergabe von proprietären Parametern, die spezifisch für das Backend sind (z. B. `num_ctx` für Ollama).

-   **Rückgabewert**: `Promise<string>` - Wird in die `sessionId` für diese Anfrage aufgelöst.

### `abort(sessionId)`

Bricht eine laufende Anfrage ab.

-   **Parameter**:
    -   `sessionId` (`string`): **Erforderlich**. Die ID der abzubrechenden Sitzung.
-   **Rückgabewert**: `boolean` - Gibt `true` zurück, wenn die Sitzung existiert und ein Abbruchsignal erfolgreich gesendet wurde; andernfalls `false`.

### `abortAllSessions()`

Bricht alle laufenden Anfragen ab.

-   **Rückgabewert**: `number` - Die Anzahl der erfolgreich abgebrochenen Sitzungen.

---

## Best Practices

-   **`AbortController` implementieren**: `abort()` und `abortAllSessions()` sollten intern `AbortController` verwenden, um `fetch`-Anfragen abzubrechen.
-   **Sitzungsbereinigung**: Nachdem eine Anfrage abgeschlossen wurde (`onComplete`) oder fehlgeschlagen ist (`onError`), muss die entsprechende `sessionId` aus der internen Sitzungsverwaltung (z. B. einer `activeSessions`-Map) entfernt werden.
-   **Parameter-Validierung**: Führen Sie eine grundlegende Formatvalidierung für kritische Eingaben wie `messages` durch.
-   **Protokollierung**: Fügen Sie an wichtigen Schritten (z. B. Anfragefehler, Analysefehler) Konsolenprotokolle hinzu, um das Debuggen zu erleichtern.
