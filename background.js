import { translate, browser } from './js/cllama.js';
import { sendToContentScript } from './js/util.js';

browser.contextMenus.create({
    id: "translate",
    title: browser.i18n.getMessage("translate"),
    contexts: ["selection"]
});

function sendTranslateMsg(msg) {
  sendToContentScript({action:"translate", msg: msg});
}

let stopFlag = false;
browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate") {
      const selectedText = info.selectionText;
      
      sendTranslateMsg(browser.i18n.getMessage("translateWaitMessage"));

      translate(selectedText, sendTranslateMsg, {
        stop: function(){
          return stopFlag;
        }
      }).catch((e) => {
        console.error('translate error:', e);
        sendTranslateMsg(browser.i18n.getMessage("cllamaError"));
      });
    }
});

// Determine if the current browser is Firefox
const isFirefox = navigator.userAgent.indexOf('Firefox') >= 0;

function handleMessage(request, sender, sendResponse) {
  if (request.action === 'openHtmlInNewTab') {
    const { htmlString, title } = request.data;

    if (isFirefox) {
      // Firefox (MV2) specific logic: Use viewer/viewer.html and sendMessage
      browser.tabs.create({ url: browser.runtime.getURL('viewer/viewer.html') }, (newTab) => {
        if (browser.runtime.lastError) {
          console.error(`Failed to create viewer tab. Error: ${browser.runtime.lastError.message}`);
          return;
        }
        const dataToStore = {};
        dataToStore[`viewer_data_${newTab.id}`] = { htmlString, title };
        browser.storage.local.set(dataToStore);
      });
    } else {
      // Chrome (MV3) specific logic: Use a data URL. This is a last resort as executeScript is failing.
      // Note: Inline scripts in data URLs may be blocked by browser's default CSP.
      const fullHtml = `<!DOCTYPE html><html><head><title>${title}</title></head><body>${htmlString}</body></html>`;
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`;
      
      browser.tabs.create({ url: dataUrl });
    }
    return true;
  }

  if (request.action === 'viewerReady') {
    // This message is only sent by viewer.js (Firefox path)
    if (isFirefox) {
      const tabId = sender.tab.id;
      const storageKey = `viewer_data_${tabId}`;
      browser.storage.local.get(storageKey, (data) => {
        if (data[storageKey] && data[storageKey].htmlString) {
          browser.tabs.sendMessage(tabId, {
            action: "displayHtml",
            data: data[storageKey]
          });
          browser.storage.local.remove(storageKey);
        }
      });
    }
    return true;
  }

  if(request.action =="close_translate"){ // Check for action property
    stopFlag = true;
    setTimeout(function(){stopFlag=false}, 500);
    // No response needed, so don't return true
    return;
  }
  if (typeof request === 'string') {
    sendResponse({ received: true, originalMessage: request });
  } else if (request.type === 'userAction') {
    console.log(`User action: ${request.action} on ${request.elementId}`);
    sendResponse({ status: 'processed', action: request.action });
  }
  return false;
}

async function handleInstalled(details) {
  if (details.reason === "install") {

  } else if (details.reason === "update") {

  }
}

browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onInstalled.addListener(handleInstalled);
