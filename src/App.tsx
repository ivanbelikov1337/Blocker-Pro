import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { useAdBlockerStore } from './store/useAdBlockerStore'
import logo from './assets/logo.png'

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
          <img 
            src={logo}  
            alt="Blocker Raptor" 
            className={`logo-icon ${enabled ? 'enabled' : 'disabled'}`}
          />
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