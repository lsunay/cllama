# Spécification du SDK AI (v2.0)

Ce document définit l'interface standard et les spécifications comportementales pour le SDK client du service AI. Il vise à garantir que les implémentations pour différents backends AI (par exemple, Ollama, OpenAI) disposent d'une API unifiée et prévisible, facilitant l'intégration et le remplacement au niveau du frontend.

## Principes de Conception Fondamentaux

1.  **Asynchrone et orienté événements**: Toutes les requêtes réseau sont des opérations asynchrones. Le cycle de vie de la réponse est géré via des fonctions de rappel (`onStart`, `onStream`, `onComplete`, `onError`).
2.  **Isolation des sessions**: Chaque appel à `sendRequest` crée une session indépendante, identifiée et gérée via un `sessionId` unique.
3.  **Streaming en priorité**: La conception du SDK impose ou donne la priorité aux réponses en streaming afin de fournir la meilleure expérience utilisateur possible.
4.  **Contrôlabilité**: Des mécanismes fiables de terminaison de requête (`abort` et `abortAllSessions`) doivent être fournis pour permettre aux utilisateurs d'interrompre les tâches de génération AI en cours.
5.  **Gestion des erreurs**: Les erreurs sont gérées via le rappel `onError` et/ou en levant des exceptions, et doivent inclure autant de contexte détaillé que possible.

---

## Spécification de l'Interface

### `constructor(config)`

Initialise l'instance du client.

-   **Paramètres**:
    -   `config` (`object`): Objet de configuration.
        -   `endpoint` (`string`): **Requis**. L'URL du point de terminaison de l'API du service AI.
        -   `apiKey` (`string`): **Optionnel**. Clé API pour l'authentification, requise par certains services (par exemple, OpenAI).
        -   `defaultModel` (`string`): **Optionnel**. L'ID du modèle par défaut à utiliser lorsqu'aucun modèle n'est spécifié.
        -   `service` (`string`): **Optionnel**. Utilisé pour identifier des types de services spécifiques (par exemple, `"ZhiPu"`, `"Google"`) pour un traitement particulier.

-   **Comportement**:
    -   Doit valider que `endpoint` existe ; sinon, lever une erreur.
    -   Stocke la configuration pour une utilisation dans les méthodes ultérieures.

### `async getModels(forceRefresh = false)`

Récupère et renvoie la liste des modèles pris en charge par le service.

-   **Paramètres**:
    -   `forceRefresh` (`boolean`): **Optionnel**. Par défaut `false`. Si `true`, ignore le cache et force une nouvelle récupération auprès du serveur.
-   **Valeur de retour**: `Promise<string[]>` - Se résout en un tableau contenant les chaînes d'ID de modèle.
-   **Comportement**:
    -   Les implémentations doivent mettre en cache la liste des modèles pour éviter les requêtes réseau inutiles.
    -    Si la requête échoue, elle doit lever une erreur descriptive.

### `async sendRequest(messages, options = {})`

Envoie une requête de chat et gère la réponse.

-   **Paramètres**:
    -   `messages` (`object[]`): **Requis**. Un tableau d'objets représentant l'historique de la conversation.
        -   Format pour chaque objet: `{ role: 'user' | 'assistant' | 'system', content: '...' }`
    -   `options` (`object`): **Optionnel**. Contient la configuration détaillée de la requête.
        -   `model` (`string`): L'ID du modèle à utiliser pour cette requête. S'il n'est pas fourni, `defaultModel` est utilisé.
        -   `onStart(sessionId)` (`function`): Appelé immédiatement au début de la requête, renvoyant le `sessionId` unique généré.
        -   `onStream(chunk, fullText, sessionId)` (`function`): Appelé pour chaque fragment du flux de données reçu.
            -   `chunk`: Le fragment de texte actuel reçu.
            -   `fullText`: Le texte complet concaténé reçu jusqu'à présent.
            -   `sessionId`: L'ID de la session actuelle.
        -   `onComplete(fullResponse, sessionId)` (`function`): Appelé lorsque le flux se termine et que la requête se termine avec succès.
        -   `onError(error, sessionId)` (`function`): Appelé lorsqu'une erreur réseau ou API survient.
        -   `temperature` (`number`): Contrôle le caractère aléatoire de la sortie du modèle, allant généralement de 0 à 2.
        -   `options` (`object`): Un conteneur pour passer des paramètres propriétaires spécifiques au backend (par exemple, `num_ctx` pour Ollama).

-   **Valeur de retour**: `Promise<string>` - Se résout en le `sessionId` pour cette requête.

### `abort(sessionId)`

Termine une requête en cours.

-   **Paramètres**:
    -   `sessionId` (`string`): **Requis**. L'ID de la session à terminer.
-   **Valeur de retour**: `boolean` - Renvoie `true` si la session existe et qu'un signal de terminaison a été envoyé avec succès ; sinon `false`.

### `abortAllSessions()`

Termine toutes les requêtes en cours.

-   **Valeur de retour**: `number` - Le nombre de sessions terminées avec succès.

---

## Meilleures Pratiques

-   **Implémenter `AbortController`**: `abort()` et `abortAllSessions()` doivent utiliser `AbortController` en interne pour annuler les requêtes `fetch`.
-   **Nettoyage de session**: Une fois qu'une requête est terminée (`onComplete`) ou échoue (`onError`), le `sessionId` correspondant doit être supprimé de la gestion interne des sessions (par exemple, une Map `activeSessions`).
-   **Validation des paramètres**: Effectuer une validation de format de base sur les entrées critiques comme `messages`.
-   **Journalisation**: Ajouter des journaux de console aux étapes clés (par exemple, échec de la requête, erreurs d'analyse) pour faciliter le débogage.
