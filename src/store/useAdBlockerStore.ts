import { create } from 'zustand';

interface AdBlockerState {
  blockedCount: number;
  enabled: boolean;
  loading: boolean;
  setBlockedCount: (count: number) => void;
  setEnabled: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  incrementBlocked: (count: number) => void;
  resetStats: () => void;
  loadStats: () => void;
  toggleEnabled: () => void;
}

// Declare chrome types
declare const chrome: {
  runtime?: {
    sendMessage?: (message: { action: string }, callback: (response?: unknown) => void) => void;
  };
};

export const useAdBlockerStore = create<AdBlockerState>((set, get) => ({
  blockedCount: 0,
  enabled: true,
  loading: true,

  setBlockedCount: (count) => set({ blockedCount: count }),
  
  setEnabled: (enabled) => set({ enabled }),
  
  setLoading: (loading) => set({ loading }),

  incrementBlocked: (count) => set((state) => ({ 
    blockedCount: state.blockedCount + count 
  })),

  loadStats: () => {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'getStats' }, (response?: unknown) => {
        if (response && typeof response === 'object' && 'blockedCount' in response && 'enabled' in response) {
          const stats = response as { blockedCount: number; enabled: boolean };
          set({ 
            blockedCount: stats.blockedCount, 
            enabled: stats.enabled,
            loading: false 
          });
        } else {
          set({ loading: false });
        }
      });
    } else {
      // Для тестування без Chrome API
      set({ blockedCount: 42, enabled: true, loading: false });
    }
  },

  toggleEnabled: () => {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'toggleEnabled' }, (response?: unknown) => {
        if (response && typeof response === 'object' && 'enabled' in response) {
          set({ enabled: (response as { enabled: boolean }).enabled });
        }
      });
    } else {
      set((state) => ({ enabled: !state.enabled }));
    }
  },

  resetStats: () => {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'resetStats' }, () => {
        get().loadStats();
      });
    } else {
      set({ blockedCount: 0 });
    }
  },
}));
