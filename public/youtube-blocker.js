(function() {
  'use strict';
  
  if (window.__blockerRaptorYT) return;
  window.__blockerRaptorYT = true;

  function pruneAdData(obj, path = '') {
    if (!obj || typeof obj !== 'object') return obj;
    
    const adKeys = [
      'adPlacements', 'adSlots', 'playerAds', 'adBreakParams',
      'adBreakHeartbeatParams', 'ads', 'adPlacement', 'adSlot',
      'instreamAdPlayerOverlayRenderer', 'adPodRenderer',
      'linearAdSequenceRenderer', 'instreamVideoAdRenderer',
      'adBreakServiceRenderer', 'playerLegacyDesktopWatchAdsRenderer',
      'promoted', 'promotedSparklesWebRenderer', 'adInfoRenderer',
      'advertisementRenderer', 'adHoverTextButtonRenderer',
      'adInfoDialogRenderer', 'adDurationRemainingRenderer',
      'playerAdParams', 'adPlaybackContextParams', 'adBreakEndpointParams',
      'daiEnabled', 'adVideo', 'inPlayerAdSlots'
    ];
    
    for (const key of adKeys) {
      if (obj.hasOwnProperty(key)) {
        delete obj[key];
      }
    }
    
    if (obj.playerResponse) {
      pruneAdData(obj.playerResponse);
    }
    
    if (obj.playerConfig?.adRequestConfig) {
      delete obj.playerConfig.adRequestConfig;
    }
    
    for (const key in obj) {
      const value = obj[key];
      if (Array.isArray(value)) {
        obj[key] = value.filter(item => {
          if (!item || typeof item !== 'object') return true;
          const itemKeys = Object.keys(item);

          const isAd = itemKeys.some(k => 
            k.toLowerCase().includes('adplacement') ||
            k.toLowerCase().includes('playerads') ||
            k.toLowerCase().includes('adslot') ||
            k.toLowerCase().includes('promoted') ||
            k === 'adSlotRenderer'
          );
          return !isAd;
        });
        obj[key].forEach(item => pruneAdData(item));
      } else if (typeof value === 'object' && value !== null) {
        pruneAdData(value);
      }
    }
    
    return obj;
  }

  const nativeParse = JSON.parse;
  JSON.parse = function() {
    const result = nativeParse.apply(this, arguments);
    try {
      const str = arguments[0];
      if (typeof str === 'string' && str.length > 100) {
        if (str.includes('"adPlacements"') || 
            str.includes('"playerAds"') ||
            str.includes('"adSlots"') ||
            str.includes('adBreakParams')) {
          pruneAdData(result);
        }
      }
    } catch(e) {}
    return result;
  };

  const nativeDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    if (obj === window && (prop === 'ytInitialPlayerResponse' || prop === 'ytInitialData')) {
      if (descriptor && descriptor.value) {
        pruneAdData(descriptor.value);
      }
      if (descriptor && descriptor.get) {
        const originalGet = descriptor.get;
        descriptor.get = function() {
          const val = originalGet.call(this);
          if (val) pruneAdData(val);
          return val;
        };
      }
    }
    return nativeDefineProperty.call(this, obj, prop, descriptor);
  };

  let _ytInitialPlayerResponse = null;
  let _ytInitialData = null;
  
  try {
    nativeDefineProperty.call(Object, window, 'ytInitialPlayerResponse', {
      configurable: true,
      get: function() { return _ytInitialPlayerResponse; },
      set: function(val) {
        if (val) pruneAdData(val);
        _ytInitialPlayerResponse = val;
      }
    });
  } catch(e) {}

  try {
    nativeDefineProperty.call(Object, window, 'ytInitialData', {
      configurable: true,
      get: function() { return _ytInitialData; },
      set: function(val) {
        if (val) pruneAdData(val);
        _ytInitialData = val;
      }
    });
  } catch(e) {}

  if (window.ytInitialPlayerResponse) {
    pruneAdData(window.ytInitialPlayerResponse);
  }
  if (window.ytInitialData) {
    pruneAdData(window.ytInitialData);
  }

  const nativeFetch = window.fetch;
  window.fetch = async function(resource, init) {
    const url = (typeof resource === 'string') ? resource : resource?.url || '';
    
    if (url.includes('/pagead/') || 
        url.includes('/ptracking') || 
        url.includes('doubleclick.net') || 
        url.includes('googlesyndication.com') ||
        url.includes('/api/stats/ads') ||
        url.includes('/get_midroll') ||
        url.includes('imasdk.googleapis.com') ||
        url.includes('play.google.com/log') ||
        url.includes('/pagead/1p-user-list') ||
        url.includes('viewthroughconversion') ||
        url.includes('/simgad/')) {
      return new Response('', { status: 204 });
    }
    
    const response = await nativeFetch.apply(this, arguments);
    
    if (url.includes('/youtubei/v1/player') || 
        url.includes('/youtubei/v1/next') ||
        url.includes('/youtubei/v1/browse')) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        pruneAdData(data);
        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch(e) {
        return response;
      }
    }
    
    return response;
  };

  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    this._blocked = false;
    
    if (typeof url === 'string') {
      if (url.includes('/pagead/') || 
          url.includes('/ptracking') || 
          url.includes('doubleclick.net') ||
          url.includes('googlesyndication.com') ||
          url.includes('/api/stats/ads') ||
          url.includes('/get_midroll') ||
          url.includes('imasdk.googleapis.com') ||
          url.includes('/simgad/')) {
        this._blocked = true;
        return nativeOpen.call(this, method, 'data:text/plain,');
      }
    }
    return nativeOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    if (this._blocked) {
      return;
    }
    
    const xhr = this;
    const url = this._url || '';
    
    if (url.includes('/youtubei/v1/player') || url.includes('/youtubei/v1/next')) {
      const originalOnLoad = xhr.onload;
      xhr.onload = function() {
        try {
          if (xhr.responseType === '' || xhr.responseType === 'text') {
            const data = JSON.parse(xhr.responseText);
            pruneAdData(data);
            Object.defineProperty(xhr, 'responseText', { value: JSON.stringify(data) });
            Object.defineProperty(xhr, 'response', { value: JSON.stringify(data) });
          }
        } catch(e) {}
        if (originalOnLoad) originalOnLoad.apply(this, arguments);
      };
    }
    
    return nativeSend.apply(this, arguments);
  };

  const nativeJson = Response.prototype.json;
  Response.prototype.json = function() {
    const url = this.url || '';
    return nativeJson.call(this).then(data => {
      if (url.includes('youtubei/v1/player') || 
          url.includes('youtubei/v1/next') ||
          url.includes('youtubei/v1/browse')) {
        pruneAdData(data);
      }
      return data;
    });
  };

  function forceSkipAd() {
    const player = document.querySelector('#movie_player');
    const video = document.querySelector('video');
    
    if (player && player.classList.contains('ad-showing')) {
      if (video) {
        video.currentTime = 99999;
        video.playbackRate = 16;
        video.muted = true;
      }
      
      document.querySelectorAll(
        '.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, ' +
        '.ytp-ad-skip-button-slot button, [class*="skip-button"]'
      ).forEach(btn => {
        btn.click();
        btn.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      
      document.querySelectorAll(
        '.ytp-ad-player-overlay, .ytp-ad-overlay-slot, .ytp-ad-text-overlay, ' +
        '.video-ads, .ytp-ad-module, .ytp-ad-image-overlay'
      ).forEach(el => {
        el.style.display = 'none';
        el.remove();
      });
    }
    
    document.querySelectorAll(
      'ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ' +
      'ytd-banner-promo-renderer, #masthead-ad, #player-ads, ' +
      'ytd-promoted-sparkles-web-renderer, ytd-display-ad-renderer, ' +
      '.ytd-rich-item-renderer:has(ytd-ad-slot-renderer)'
    ).forEach(el => el.remove());
  }

  setInterval(forceSkipAd, 50);
  
  const observer = new MutationObserver((mutations) => {
    forceSkipAd();
    
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        const target = m.target;
        if (target.classList?.contains('ad-showing')) {
          forceSkipAd();
        }
      }
    }
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  console.log('[Blocker Raptor] YouTube blocker v2 initialized');
})();
