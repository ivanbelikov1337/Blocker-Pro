import { useState, useEffect } from 'react'
import './App.css'

interface Stats {
  blockedCount: number;
  enabled: boolean;
}

// Declare chrome types for extension API
declare const chrome: {
  runtime?: {
    sendMessage?: (message: { action: string }, callback: (response?: unknown) => void) => void;
  };
};

function App() {
  const [stats, setStats] = useState<Stats>({ blockedCount: 0, enabled: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = () => {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'getStats' }, (response?: unknown) => {
          if (response && typeof response === 'object' && 'blockedCount' in response && 'enabled' in response) {
            setStats(response as Stats);
          }
          setLoading(false);
        });
      } else {
        setStats({ blockedCount: 42, enabled: true });
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const toggleEnabled = () => {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'toggleEnabled' }, (response?: unknown) => {
        if (response && typeof response === 'object' && 'enabled' in response) {
          setStats(prev => ({ ...prev, enabled: (response as { enabled: boolean }).enabled }));
        }
      });
    } else {
      setStats(prev => ({ ...prev, enabled: !prev.enabled }));
    }
  };

  const resetStats = () => {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'resetStats' }, () => {
        chrome.runtime?.sendMessage?.({ action: 'getStats' }, (response?: unknown) => {
          if (response && typeof response === 'object' && 'blockedCount' in response && 'enabled' in response) {
            setStats(response as Stats);
          }
        });
      });
    } else {
      setStats(prev => ({ ...prev, blockedCount: 0 }));
    }
  };

  if (loading) {
    return (
      <div className="popup">
        <div className="loading">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="popup">
      <div className="header">
        <div className="logo-container">
          <svg className="shield-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" 
                  fill={stats.enabled ? "#4CAF50" : "#9E9E9E"} 
                  stroke="white" 
                  strokeWidth="2"/>
            {stats.enabled && (
              <path d="M9 12L11 14L15 10" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"/>
            )}
          </svg>
        </div>
        <h1>Ad Blocker Pro</h1>
        <p className="subtitle">Захист від реклами</p>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-number">{stats.blockedCount}</div>
          <div className="stat-label">Заблоковано сьогодні</div>
        </div>
      </div>

      <div className="controls">
        <button 
          className={`toggle-btn ${stats.enabled ? 'enabled' : 'disabled'}`}
          onClick={toggleEnabled}
        >
          <span className="toggle-text">
            {stats.enabled ? '✓ Увімкнено' : '✕ Вимкнено'}
          </span>
        </button>

        <button className="reset-btn" onClick={resetStats}>
          Скинути статистику
        </button>
      </div>

      <div className="info">
        <p className="info-text">
          {stats.enabled 
            ? 'Розширення активне і блокує рекламу на всіх сайтах' 
            : 'Розширення вимкнено. Натисніть кнопку для активації'}
        </p>
      </div>

      <div className="footer">
        <small>Версія 1.0.0</small>
      </div>
    </div>
  )
}

export default App
