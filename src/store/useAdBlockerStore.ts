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
    id?: string;
    sendMessage?: (message: { action: string }, callback: (response?: unknown) => void) => void;
  };
};

// Helper function to check if we're running as a Chrome extension
const isExtensionContext = (): boolean => {
  try {
    return !!(chrome?.runtime?.id && chrome?.runtime?.sendMessage);
  } catch {
    return false;
  }
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
    if (isExtensionContext()) {
      chrome.runtime!.sendMessage!({ action: 'getStats' }, (response?: unknown) => {
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
      // Dev mode - use mock data
      set({ blockedCount: 42, enabled: true, loading: false });
    }
  },

  toggleEnabled: () => {
    if (isExtensionContext()) {
      chrome.runtime!.sendMessage!({ action: 'toggleEnabled' }, (response?: unknown) => {
        if (response && typeof response === 'object' && 'enabled' in response) {
          set({ enabled: (response as { enabled: boolean }).enabled });
        }
      });
    } else {
      // Dev mode - toggle locally
      set((state) => ({ enabled: !state.enabled }));
    }
  },

  resetStats: () => {
    if (isExtensionContext()) {
      chrome.runtime!.sendMessage!({ action: 'resetStats' }, () => {
        get().loadStats();
      });
    } else {
      // Dev mode - reset locally
      set({ blockedCount: 0 });
    }
  },
}));
