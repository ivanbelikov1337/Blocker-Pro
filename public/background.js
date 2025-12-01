// Background Service Worker для Chrome Extension
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['enabled', 'blockedCount'], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.sync.set({ enabled: true, blockedCount: 0 });
    }
  });
  chrome.alarms.create('dailyReset', { periodInMinutes: 1440 });
  chrome.alarms.create('saveStats', { periodInMinutes: 1 });
});

let pendingBlockedCount = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'adBlocked') {
    pendingBlockedCount += request.count || 1;
    sendResponse({ success: true });
  } else if (request.action === 'getStats') {
    chrome.storage.sync.get(['blockedCount', 'enabled'], (result) => {
      sendResponse({
        blockedCount: (result.blockedCount || 0) + pendingBlockedCount,
        enabled: result.enabled !== false
      });
    });
    return true;
  } else if (request.action === 'toggleEnabled') {
    chrome.storage.sync.get(['enabled'], (result) => {
      const newState = !result.enabled;
      chrome.storage.sync.set({ enabled: newState }, () => {
        sendResponse({ enabled: newState });
        
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
              chrome.tabs.sendMessage(tab.id, { 
                action: 'updateEnabled', 
                enabled: newState 
              }).catch(() => {});
            }
          });
        });
      });
    });
    return true;
  } else if (request.action === 'resetStats') {
    pendingBlockedCount = 0;
    chrome.storage.sync.set({ blockedCount: 0 }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    pendingBlockedCount = 0;
    chrome.storage.sync.set({ blockedCount: 0 });
  } else if (alarm.name === 'saveStats') {
    if (pendingBlockedCount > 0) {
      chrome.storage.sync.get(['blockedCount'], (result) => {
        const total = (result.blockedCount || 0) + pendingBlockedCount;
        chrome.storage.sync.set({ blockedCount: total });
        pendingBlockedCount = 0;
      });
    }
  }
});