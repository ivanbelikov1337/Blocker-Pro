import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { useAdBlockerStore } from './store/useAdBlockerStore'

function App() {
  const { t } = useTranslation();
  const { blockedCount, enabled, loading, loadStats, toggleEnabled, resetStats } = useAdBlockerStore();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="popup">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="popup">
      <div className="header">
        <div className="logo-container">
          <svg className="shield-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" 
                  fill={enabled ? "#4CAF50" : "#9E9E9E"} 
                  stroke="white" 
                  strokeWidth="2"/>
            {enabled && (
              <path d="M9 12L11 14L15 10" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"/>
            )}
          </svg>
        </div>
        <h1>{t('header.title')}</h1>
        <p className="subtitle">{t('header.subtitle')}</p>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-number">{blockedCount}</div>
          <div className="stat-label">{t('stats.blockedToday')}</div>
        </div>
      </div>

      <div className="controls">
        <button 
          className={`toggle-btn ${enabled ? 'enabled' : 'disabled'}`}
          onClick={toggleEnabled}
        >
          <span className="toggle-text">
            {enabled ? t('controls.enabled') : t('controls.disabled')}
          </span>
        </button>

        <button className="reset-btn" onClick={resetStats}>
          {t('controls.resetStats')}
        </button>
      </div>

      <div className="info">
        <p className="info-text">
          {enabled 
            ? t('info.activeMessage') 
            : t('info.disabledMessage')}
        </p>
      </div>

      <div className="footer">
        <small>{t('footer.version')} 1.0.0</small>
      </div>
    </div>
  )
}

export default App