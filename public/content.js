(function() {
  'use strict';

  let isEnabled = false;
  let isInitialized = false;
  let isContextValid = true;
  const isYouTube = window.location.hostname.includes('youtube.com');
  const hostname = window.location.hostname;
  
  // Sites to exclude from generic ad blocking
  const excludedSites = [
    'chat.openai.com',
    'chatgpt.com',
    'openai.com',
    'github.com',
    'google.com',
    'facebook.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'linkedin.com',
    'reddit.com',
    'stackoverflow.com',
    'amazon.com',
    'ebay.com',
    'netflix.com',
    'twitch.tv',
    'discord.com',
    'slack.com',
    'notion.so',
    'figma.com',
    'codepen.io',
    'jsfiddle.net',
    'codesandbox.io'
  ];
  
  const isExcludedSite = excludedSites.some(site => hostname.includes(site));
  
  function checkContext() {
    try {
      chrome.runtime.getURL('');
      return true;
    } catch (e) {
      isContextValid = false;
      cleanup();
      return false;
    }
  }
  
  function cleanup() {
    if (youtubeInterval) {
      clearInterval(youtubeInterval);
      youtubeInterval = null;
    }
    if (playerObserver) {
      playerObserver.disconnect();
      playerObserver = null;
    }
    if (observer) {
      observer.disconnect();
    }
  }
  
  let pendingBlocked = 0;
  let lastSendTime = 0;
  const SEND_INTERVAL = 5000;

  function sendBlockedCount() {
    if (!isContextValid || !checkContext()) return;
    
    const now = Date.now();
    if (pendingBlocked > 0 && now - lastSendTime > SEND_INTERVAL) {
      try {
        chrome.runtime.sendMessage({ action: 'adBlocked', count: pendingBlocked }).catch(() => {
          isContextValid = false;
        });
      } catch (e) {
        isContextValid = false;
      }
      pendingBlocked = 0;
      lastSendTime = now;
    }
  }

  let youtubeInterval = null;
  let playerObserver = null;
  let observer = null;

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

  const youtubeAdSelectors = [
    '.ytp-ad-module',
    '.ytp-ad-overlay-slot',
    '.ytp-ad-text-overlay',
    '.ytp-ad-skip-button-container',
    '.video-ads',
    '#player-ads',
    '#masthead-ad',
    'ytd-ad-slot-renderer',
    'ytd-banner-promo-renderer',
    'ytd-statement-banner-renderer',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-display-ad-renderer',
    '.ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-sparkles-web-renderer',
    '.ytd-action-companion-ad-renderer',
    'ytd-companion-slot-renderer',
    '#offer-module'
  ];

  const adDomains = [
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'advertising.com',
    'ad.doubleclick.net',
    'adservice.google.com'
  ];

  chrome.storage.sync.get(['enabled'], (result) => {
    if (!checkContext()) return;
    isEnabled = result.enabled !== false;
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!checkContext()) return;
    
    if (request.action === 'updateEnabled') {
      isEnabled = request.enabled;
      isInitialized = true;
      
      if (isYouTube) {
        if (isEnabled) {
          startYouTubeAdBlocker();
        } else {
          stopYouTubeAdBlocker();
        }
      }
      
      sendResponse({ success: true });
    }
  });

  function blockAds() {
    if (!isEnabled) return 0;
    if (isYouTube || isExcludedSite) return 0;
    
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
      pendingBlocked += blockedCount;
      sendBlockedCount();
    }

    return blockedCount;
  }

  function blockAdIframes() {
    if (!isEnabled) return 0;
    
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
      pendingBlocked += blockedCount;
      sendBlockedCount();
    }

    return blockedCount;
  }

  function skipYouTubeAds() {
    if (!isEnabled || !isYouTube || !isContextValid) return 0;
    
    let blockedCount = 0;
    const video = document.querySelector('video');
    const player = document.querySelector('#movie_player');
    
    if (!video || !player) return 0;

    const adShowing = player.classList.contains('ad-showing');
    
    if (adShowing) {
      if (video.duration) {
        video.currentTime = video.duration;
      }
      
      const skipBtn = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, button[class*="skip"]');
      if (skipBtn) skipBtn.click();
      
      document.querySelectorAll('.ytp-ad-module, .ytp-ad-overlay-slot, .ytp-ad-text-overlay, .video-ads, .ytp-ad-player-overlay').forEach(el => el.remove());
      
      blockedCount++;
    }

    document.querySelectorAll('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-banner-promo-renderer, #masthead-ad, #player-ads').forEach(el => {
      el.remove();
      blockedCount++;
    });

    if (blockedCount > 0) {
      pendingBlocked += blockedCount;
      sendBlockedCount();
    }

    return blockedCount;
  }

  
  function startYouTubeAdBlocker() {
    if (!isYouTube || youtubeInterval || !isContextValid) return;
    
    youtubeInterval = setInterval(() => {
      if (!isContextValid) {
        cleanup();
        return;
      }
      if (isEnabled) skipYouTubeAds();
    }, 100);
    
    const observePlayer = () => {
      const player = document.querySelector('#movie_player');
      if (player && !playerObserver) {
        playerObserver = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.attributeName === 'class' && player.classList.contains('ad-showing')) {
              skipYouTubeAds();
            }
          }
        });
        playerObserver.observe(player, { attributes: true, attributeFilter: ['class'] });
      }
    };
    
    observePlayer();
    setTimeout(observePlayer, 1000);
    setTimeout(observePlayer, 3000);
  }

  function stopYouTubeAdBlocker() {
    if (youtubeInterval) {
      clearInterval(youtubeInterval);
      youtubeInterval = null;
    }
    if (playerObserver) {
      playerObserver.disconnect();
      playerObserver = null;
    }
  }

  observer = new MutationObserver((mutations) => {
    if (!isEnabled || !isContextValid) return;
    
    let totalBlocked = 0;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (!isYouTube && !isExcludedSite) {
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
          }


          if (isYouTube) {
            youtubeAdSelectors.forEach(selector => {
              try {
                if (node.matches && node.matches(selector)) {
                  node.style.setProperty('display', 'none', 'important');
                  node.remove();
                  totalBlocked++;
                }
                if (node.querySelectorAll) {
                  const children = node.querySelectorAll(selector);
                  children.forEach(child => {
                    child.style.setProperty('display', 'none', 'important');
                    child.remove();
                    totalBlocked++;
                  });
                }
              } catch (e) {}
            });
            
            if (node.classList && (node.classList.contains('ad-showing') || 
                node.classList.contains('ytp-ad-player-overlay'))) {
              skipYouTubeAds();
            }
          }

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
      pendingBlocked += totalBlocked;
      sendBlockedCount();
    }
  });

  function init() {
    if (!checkContext()) return;
    
    chrome.storage.sync.get(['enabled'], (result) => {
      if (!checkContext()) return;
      
      isEnabled = result.enabled !== false;
      isInitialized = true;
      
      if (!isEnabled) {
        stopYouTubeAdBlocker();
        return;
      }

      blockAds();
      blockAdIframes();
      
      if (isYouTube) {
        startYouTubeAdBlocker();
        skipYouTubeAds();
      }

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        if (isEnabled) {
          blockAds();
          blockAdIframes();
          if (isYouTube) skipYouTubeAds();
        }
      }, 1000);
      
      setTimeout(() => {
        if (isEnabled) {
          blockAds();
          blockAdIframes();
          if (isYouTube) skipYouTubeAds();
        }
      }, 3000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => {
    if (isInitialized && isEnabled) {
      blockAds();
      blockAdIframes();
    }
  });
})();
