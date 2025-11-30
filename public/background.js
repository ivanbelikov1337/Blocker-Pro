// Background Service Worker для Chrome Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Ad Blocker Pro встановлено!');
  
  chrome.storage.sync.get(['enabled', 'blockedCount'], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.sync.set({ enabled: true, blockedCount: 0 });
    }
  });
  chrome.alarms.create('dailyReset', { periodInMinutes: 1440 }); // 24 години
});

let blockedCount = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'adBlocked') {
    blockedCount += request.count || 1;
    
    chrome.storage.sync.get(['blockedCount'], (result) => {
      const totalBlocked = (result.blockedCount || 0) + (request.count || 1);
      chrome.storage.sync.set({ blockedCount: totalBlocked });
      
    });
    
    sendResponse({ success: true });
  } else if (request.action === 'getStats') {
    chrome.storage.sync.get(['blockedCount', 'enabled'], (result) => {
      sendResponse({
        blockedCount: result.blockedCount || 0,
        enabled: result.enabled !== false
      });
    });
    return true; // Async response
  } else if (request.action === 'toggleEnabled') {
    chrome.storage.sync.get(['enabled'], (result) => {
      const newState = !result.enabled;
      chrome.storage.sync.set({ enabled: newState }, () => {
        sendResponse({ enabled: newState });
        
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.url && !tab.url.startsWith('chrome://')) {
              chrome.tabs.reload(tab.id);
            }
          });
        });
      });
    });
    return true; // Async response
  } else if (request.action === 'resetStats') {
    chrome.storage.sync.set({ blockedCount: 0 }, () => {
      blockedCount = 0;
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    chrome.storage.sync.set({ blockedCount: 0 });
    blockedCount = 0;
  }
});