const browser = (typeof chrome !== 'undefined') ? chrome : (typeof browser !== 'undefined') ? browser : null;
const isFirefox = navigator.userAgent.indexOf('Firefox') >= 0;

const TRANSLATE_ROOT_ID = 'cllama-translate-root';
const PANEL_CONFIG = {
    width: '580px',
    height: '390px',
    zIndex: 2147483647
};

let shadowRootForTranslate = null;
let panelBodyForTranslate = null;

/**
 * Extract page content based on custom CSS selectors or default to body text
 */
function getPageInfo() {
    return new Promise((resolve) => {
        const url = window.location.href;
        let content = document.body.innerText;

        browser.storage.local.get("urls", (urlsResult) => {
            const configurations = urlsResult.urls || [];

            for (const item of configurations) {
                if (url.startsWith(item.url)) {
                    content = "";
                    const elements = document.body.querySelectorAll(item.cssSelector);
                    
                    elements.forEach((element) => {
                        content += element.innerText + " ";
                    });

                    if (content.length < 1) {
                        console.error(`No content found with CSS selector [${item.cssSelector}], falling back to full page content`);
                        content = document.body.innerText;
                    } else {
                        break;
                    }
                }
            }

            resolve({
                title: document.title,
                content,
                url
            });
        });
    });
}

/**
 * Send message to background script with browser-specific handling
 */
function sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
        if (isFirefox) {
            browser.runtime.sendMessage(message)
                .then(response => resolve(response))
                .catch(error => reject(error));
        } else {
            browser.runtime.sendMessage(message, response => {
                if (browser.runtime.lastError) {
                    reject(browser.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        }
    });
}

/**
 * Initialize the translation panel with shadow DOM
 */
function initializeTranslatePanel() {
    if (document.getElementById(TRANSLATE_ROOT_ID)) {
        return; // Already initialized
    }

    const host = document.createElement('div');
    host.id = TRANSLATE_ROOT_ID;
    document.body.appendChild(host);
    
    const shadow = host.attachShadow({ mode: 'open' });
    shadowRootForTranslate = shadow;

    injectStyles(shadow);
    createPanelStructure(shadow);
    setupPanelEventListeners(shadow);
}

/**
 * Inject CSS stylesheets into shadow DOM
 */
function injectStyles(shadow) {
    const stylesheets = ['/css/android.css', '/css/cllama.css', '/css/github-markdown-dark.css'];
    
    stylesheets.forEach(styleUrl => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', browser.runtime.getURL(styleUrl));
        shadow.appendChild(link);
    });

    const customStyles = document.createElement('style');
    customStyles.textContent = `
        #cllama-translation-panel {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: ${PANEL_CONFIG.zIndex};
            width: ${PANEL_CONFIG.width};
            height: ${PANEL_CONFIG.height};
            flex-direction: column;
        }
        #cllama-translation-panel.visible {
            display: flex;
        }
        #panel-body-translate {
            flex-grow: 1;
            overflow-y: auto;
        }
    `;
    shadow.appendChild(customStyles);
}

/**
 * Create the panel HTML structure
 */
function createPanelStructure(shadow) {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = 'cllama-translation-panel';
    panel.innerHTML = `
        <div class="panel-header">
            <span id="panel-title-translate">${browser.i18n.getMessage('translate')}</span>
            <button class="panel-close-btn" id="panel-close-translate">×</button>
        </div>
        <div class="panel-content markdown-body" id="panel-body-translate"></div>
    `;
    shadow.appendChild(panel);

    panelBodyForTranslate = shadow.querySelector('#panel-body-translate');
}

/**
 * Setup event listeners for panel interactions
 */
function setupPanelEventListeners(shadow) {
    const panel = shadow.querySelector('#cllama-translation-panel');
    const panelCloseBtn = shadow.querySelector('#panel-close-translate');
    const panelHeader = shadow.querySelector('.panel-header');


    panelCloseBtn.addEventListener('click', () => {
        panel.classList.remove('visible');
        sendMessageToBackground({ action: "close_translate" })
            .catch(error => console.error("Error sending close_translate message:", error));
    });

    makeDraggable(panel, panelHeader);
}

/**
 * Make panel draggable by header
 */
function makeDraggable(panel, panelHeader) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let hasDragged = false;
    let originalUserSelect = '';

    panelHeader.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        hasDragged = false;

        startX = e.clientX;
        startY = e.clientY;

        const rect = panel.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        panel.style.cursor = 'grabbing';
        panelHeader.style.cursor = 'grabbing';

        originalUserSelect = document.body.style.userSelect;
        document.body.style.userSelect = 'none';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;

        if (!hasDragged) {
            // Lock position to pixels and remove transform on first movement
            panel.style.left = `${initialLeft}px`;
            panel.style.top = `${initialTop}px`;
            panel.style.transform = 'none';
            hasDragged = true;
        }

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        panel.style.left = `${initialLeft + deltaX}px`;
        panel.style.top = `${initialTop + deltaY}px`;
    }

    function onMouseUp() {
        isDragging = false;
        panel.style.cursor = 'default';
        panelHeader.style.cursor = 'grab';
        document.body.style.userSelect = originalUserSelect;

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}


/**
 * Show translation panel with content
 */
function showTranslationPanel(message) {
    if (!document.getElementById(TRANSLATE_ROOT_ID)) {
        initializeTranslatePanel();
    }

    const panel = shadowRootForTranslate.querySelector('#cllama-translation-panel');
    if (panel) {
        const isWaitingMessage = message === browser.i18n.getMessage("translateWaitMessage");
        
        if(isWaitingMessage)
             panel.classList.add('visible');

        if (panel.classList.contains('visible')) {           
            if (panelBodyForTranslate) {
                panelBodyForTranslate.innerHTML = message.replace(/\n/g, '<br>');
            }
        }
    }
}

/**
 * Handle page info request with browser-specific response
 */
function handlePageInfoRequest(sendResponse) {
    getPageInfo()
        .then(data => sendResponse(data))
        .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true; // Keep channel open for async response
}

/**
 * Message listener for extension commands
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "getPageInfo":
            return handlePageInfoRequest(sendResponse);
        
        case "translate":
            showTranslationPanel(request.msg);
            break;
    }
});

/**
 * Listen for messages from page scripts
 */
window.addEventListener("message", (event) => {
    // Only accept messages from same window
    if (event.source !== window) return;

    const { type, payload } = event.data;

    // Handle import requests from page
    if (type === "callImportInsightPrompt" || type === "callImportAIdirPrompt") {
        browser.runtime.sendMessage(
            {
                action: type,
                data: payload
            },
            (response) => {
                window.postMessage(
                    {
                        type: "EXTENSION_RESPONSE",
                        payload: response
                    },
                    "*"
                );
            }
        );
    }
});
