(function() {
  'use strict';

  const adSelectors = [
    '[class*="ad-"]',
    '[class*="ads-"]',
    '[id*="ad-"]',
    '[id*="ads-"]',
    '[class*="advertisement"]',
    '[class*="banner"]',
    '[class*="sponsor"]',
    '[class*="promo"]',
    
    '.adsbygoogle',
    'ins.adsbygoogle',
    
    '[class*="doubleclick"]',
    '[id*="google_ads"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[src*="advertising"]',
    
    'div[id*="AdContainer"]',
    'div[class*="ad-container"]',
    'div[class*="ad-wrapper"]',
    'aside[class*="ad"]',
    
    '[class*="social-share"]',
    '[class*="share-buttons"]'
  ];

  const adDomains = [
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'advertising.com',
    'ad.doubleclick.net',
    'adservice.google.com'
  ];

  function blockAds() {
    let blockedCount = 0;

    adSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && element.style.display !== 'none') {
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('height', '0', 'important');
            element.style.setProperty('width', '0', 'important');
            blockedCount++;
          }
        });
      } catch (e) {
      }
    });

    if (blockedCount > 0) {
      chrome.runtime.sendMessage({ action: 'adBlocked', count: blockedCount });
    }

    return blockedCount;
  }

  function blockAdIframes() {
    const iframes = document.querySelectorAll('iframe');
    let blockedCount = 0;

    iframes.forEach(iframe => {
      const src = iframe.src || '';
      const shouldBlock = adDomains.some(domain => src.includes(domain));

      if (shouldBlock) {
        iframe.style.setProperty('display', 'none', 'important');
        iframe.remove();
        blockedCount++;
      }
    });

    if (blockedCount > 0) {
      chrome.runtime.sendMessage({ action: 'adBlocked', count: blockedCount });
    }

    return blockedCount;
  }

  const observer = new MutationObserver((mutations) => {
    let totalBlocked = 0;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          adSelectors.forEach(selector => {
            try {
              if (node.matches && node.matches(selector)) {
                node.style.setProperty('display', 'none', 'important');
                totalBlocked++;
              }
              if (node.querySelectorAll) {
                const children = node.querySelectorAll(selector);
                children.forEach(child => {
                  child.style.setProperty('display', 'none', 'important');
                  totalBlocked++;
                });
              }
            } catch (e) {
            }
          });

          if (node.tagName === 'IFRAME') {
            const src = node.src || '';
            const shouldBlock = adDomains.some(domain => src.includes(domain));
            if (shouldBlock) {
              node.style.setProperty('display', 'none', 'important');
              node.remove();
              totalBlocked++;
            }
          }
        }
      });
    });

    if (totalBlocked > 0) {
      chrome.runtime.sendMessage({ action: 'adBlocked', count: totalBlocked });
    }
  });

  function init() {
    const blockedAds = blockAds();
    const blockedIframes = blockAdIframes();
    
    console.log(`Ad Blocker Pro: Заблоковано ${blockedAds + blockedIframes} рекламних елементів`);

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });

    setTimeout(blockAds, 1000);
    setTimeout(blockAds, 3000);
    setTimeout(blockAdIframes, 1000);
    setTimeout(blockAdIframes, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => {
    blockAds();
    blockAdIframes();
  });
})();
