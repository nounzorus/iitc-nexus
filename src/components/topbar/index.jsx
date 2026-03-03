import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { theme$, agentData$ } from '../../services/iitc-signals.js';
import { useIITCHook } from '../../hooks/use-iitc-hook.js';
import { onRegionScoreUpdate, fetchRegionScore } from '../../utils/region-score.js';
import { FloatingPortalDetail } from '../floating-portal-detail.js';
import { FloatingBookmarks } from '../floating-bookmarks.js';
import { FloatingToolbox } from '../floating-toolbox.js';
import styles from './topbar.module.css';

const PLUGIN_VERSION = '0.1.0';

function InfoModal({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>
          &times;
        </button>
        <div className={styles.modalTitle}>IITC DASHBOARD</div>
        <div className={styles.modalVersion}>v{PLUGIN_VERSION}</div>
        <div className={styles.modalAuthor}>
          by <span className={styles.nick}>nounzor</span>
        </div>
      </div>
    </div>
  );
}

function PasscodeModal({ onClose }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  function submitPasscode() {
    const input = inputRef.current;
    const code = input && input.value.trim();
    if (!code) return;
    const redeem = document.getElementById('redeem');
    if (redeem) {
      redeem.value = code;
      redeem.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, bubbles: true }));
    }
    if (input) input.value = '';
    onClose();
  }

  function handleKey(e) {
    if (e.key === 'Enter') submitPasscode();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>
          &times;
        </button>
        <div className={styles.modalTitle}>REDEEM PASSCODE</div>
        <input
          ref={inputRef}
          className={styles.passcodeInput}
          type="text"
          placeholder="Enter passcode..."
          autoComplete="off"
          onKeyPress={handleKey}
        />
        <button className={`${styles.btn} ${styles.passcodeSubmit}`} onClick={submitPasscode}>
          REDEEM
        </button>
        <div className={styles.passcodeStatus}>{status}</div>
      </div>
    </div>
  );
}

export function Topbar() {
  const theme = useIITCHook(theme$);
  const agent = useIITCHook(agentData$);
  const [coords, setCoords] = useState({ lat: '---', lng: '---' });
  const [clock, setClock] = useState('--:--:--');
  const [cellName, setCellName] = useState('---');
  const [showInfo, setShowInfo] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fsWidgetState = useRef({ toolbox: true, portal: true, bookmarks: false });
  const fsTogglesEl = useRef(null);
  const floatingToolbox = useRef(null);
  const floatingPortalDetail = useRef(null);
  const floatingBookmarks = useRef(null);

  // Clock
  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toTimeString().slice(0, 8)), 1000);
    setClock(new Date().toTimeString().slice(0, 8));
    return () => clearInterval(id);
  }, []);

  // Coords from map
  useEffect(() => {
    function onMoveEnd() {
      const c = window.map?.getCenter();
      if (c) setCoords({ lat: c.lat.toFixed(4), lng: c.lng.toFixed(4) });
    }
    if (window.map) {
      window.map.on('moveend', onMoveEnd);
      onMoveEnd();
      return () => window.map.off('moveend', onMoveEnd);
    }
  }, []);

  // Cell name from region score updates + trigger initial fetch
  useEffect(() => {
    const timer = setTimeout(fetchRegionScore, 3000);
    const unsub = onRegionScoreUpdate((data) => {
      if (data.regionName) setCellName(data.regionName);
    });
    // Re-fetch on map move
    const onMove = () => fetchRegionScore();
    if (window.map) window.map.on('moveend', onMove);
    return () => {
      clearTimeout(timer);
      unsub();
      if (window.map) window.map.off('moveend', onMove);
    };
  }, []);

  function handleThemeToggle() {
    const newTheme = theme === 'res' ? 'enl' : 'res';
    theme$.value = newTheme;
    localStorage.setItem('iitc-dash-theme', newTheme);
    const dashRoot = document.getElementById('iitc-dash-root');
    if (dashRoot) dashRoot.classList.toggle('theme-enl', newTheme === 'enl');
  }

  function _createFsToggles(centerEl) {
    if (fsTogglesEl.current) return fsTogglesEl.current;
    const el = document.createElement('div');
    el.className = 'iitc-dash-fs-toggles';

    const buttons = [
      { key: 'toolbox', label: 'TOOLS' },
      { key: 'portal', label: 'PORTAL' },
      { key: 'bookmarks', label: 'BKMRK' },
    ];

    for (const { key, label } of buttons) {
      const btn = document.createElement('button');
      btn.className = 'iitc-dash-fs-toggle-btn' + (fsWidgetState.current[key] ? ' active' : '');
      btn.textContent = label;
      btn.dataset.widget = key;
      btn.addEventListener('click', () => {
        fsWidgetState.current[key] = !fsWidgetState.current[key];
        btn.classList.toggle('active', fsWidgetState.current[key]);
        _syncFsWidget(key, centerEl);
      });
      el.appendChild(btn);
    }
    centerEl.appendChild(el);
    fsTogglesEl.current = el;
    return el;
  }

  function _syncFsWidget(key, centerEl) {
    if (key === 'toolbox') {
      if (fsWidgetState.current.toolbox) {
        if (!floatingToolbox.current) {
          floatingToolbox.current = new FloatingToolbox(centerEl);
          floatingToolbox.current.onVisibilityChange = (visible) => {
            if (!visible) {
              fsWidgetState.current.toolbox = false;
              const btn = fsTogglesEl.current && fsTogglesEl.current.querySelector('[data-widget="toolbox"]');
              if (btn) btn.classList.remove('active');
            }
          };
        }
        floatingToolbox.current.show();
      } else {
        if (floatingToolbox.current) floatingToolbox.current.hide();
      }
    } else if (key === 'portal') {
      if (fsWidgetState.current.portal) {
        if (!floatingPortalDetail.current) floatingPortalDetail.current = new FloatingPortalDetail(centerEl);
        floatingPortalDetail.current.show();
      } else {
        if (floatingPortalDetail.current) floatingPortalDetail.current.hide();
      }
    } else if (key === 'bookmarks') {
      if (fsWidgetState.current.bookmarks) {
        if (!floatingBookmarks.current) {
          floatingBookmarks.current = new FloatingBookmarks(centerEl);
          floatingBookmarks.current.onVisibilityChange = (visible) => {
            if (!visible) {
              fsWidgetState.current.bookmarks = false;
              const btn = fsTogglesEl.current && fsTogglesEl.current.querySelector('[data-widget="bookmarks"]');
              if (btn) btn.classList.remove('active');
            }
          };
        }
        floatingBookmarks.current.show();
      } else {
        if (floatingBookmarks.current) floatingBookmarks.current.hide();
      }
    }
  }

  function toggleFullscreen() {
    const root = document.getElementById('iitc-dash-root');
    if (!root) return;
    const next = !isFullscreen;
    setIsFullscreen(next);
    const left = document.getElementById('iitc-dash-left-panel');
    const right = document.getElementById('iitc-dash-right-panel');
    const bottom = document.getElementById('iitc-dash-bottom-panel');
    const centerEl = document.getElementById('iitc-dash-center');
    if (next) {
      if (left) left.style.display = 'none';
      if (right) right.style.display = 'none';
      if (bottom) bottom.style.display = 'none';
      root.style.gridTemplateColumns = '1fr';
      root.style.gridTemplateRows = '42px 1fr';
      if (centerEl) {
        _createFsToggles(centerEl);
        if (fsWidgetState.current.toolbox) _syncFsWidget('toolbox', centerEl);
        if (fsWidgetState.current.portal) _syncFsWidget('portal', centerEl);
        if (fsWidgetState.current.bookmarks) _syncFsWidget('bookmarks', centerEl);
      }
    } else {
      if (fsTogglesEl.current && fsTogglesEl.current.parentNode) {
        fsTogglesEl.current.parentNode.removeChild(fsTogglesEl.current);
      }
      fsTogglesEl.current = null;
      if (floatingToolbox.current) floatingToolbox.current.hide();
      if (floatingPortalDetail.current) floatingPortalDetail.current.hide();
      if (floatingBookmarks.current) floatingBookmarks.current.hide();
      if (left) left.style.display = '';
      if (right) right.style.display = '';
      if (bottom) bottom.style.display = '';
      root.style.gridTemplateColumns = '';
      root.style.gridTemplateRows = '';
    }
    setTimeout(() => {
      if (window.map && window.map.invalidateSize) window.map.invalidateSize();
    }, 50);
  }

  // Spacebar fullscreen toggle
  useEffect(() => {
    const handler = (e) => {
      if (e.code !== 'Space') return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (document.activeElement && document.activeElement.isContentEditable)
      )
        return;
      e.preventDefault();
      toggleFullscreen();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  // Cleanup floating widgets on unmount
  useEffect(() => {
    return () => {
      if (floatingToolbox.current) {
        floatingToolbox.current.destroy();
        floatingToolbox.current = null;
      }
      if (floatingPortalDetail.current) {
        floatingPortalDetail.current.destroy();
        floatingPortalDetail.current = null;
      }
      if (floatingBookmarks.current) {
        floatingBookmarks.current.destroy();
        floatingBookmarks.current = null;
      }
      if (fsTogglesEl.current && fsTogglesEl.current.parentNode) {
        fsTogglesEl.current.remove();
        fsTogglesEl.current = null;
      }
    };
  }, []);

  return (
    <div className={styles.topbar} id="iitc-dash-topbar">
      <div className={styles.left}>
        <div className={styles.logo}>
          IITC<span className={styles.logoSub}>NEXUS UI DASHBOARD</span>
        </div>
        {agent.nickname !== '?' && (
          <div className={styles.agentInfo}>
            <span className={`${styles.agentNick} ${agent.team === 'ENLIGHTENED' ? styles.enl : styles.res}`}>
              {agent.nickname}
            </span>
            <span className={styles.agentDetail}>L{agent.level || '?'}</span>
            <span className={styles.agentDetail}>{(agent.ap || 0).toLocaleString()} AP</span>
            <span className={styles.agentDetail}>{(agent.energy || 0).toLocaleString()} XM</span>
          </div>
        )}
      </div>
      <div className={styles.right}>
        <span id="iitc-dash-cell-info" title="Current S2 cell region name">
          CELL: {cellName}
        </span>
        <span>|</span>
        <span title="Map center coordinates">
          LAT {coords.lat} LON {coords.lng}
        </span>
        <span>|</span>
        <span className={styles.clock}>{clock}</span>
        <span>|</span>
        <button className={styles.btn} onClick={handleThemeToggle}>
          {theme.toUpperCase()}
        </button>
        <button className={styles.btn} onClick={() => setShowPasscode(true)}>
          &#x1F511;
        </button>
        <button
          className={`${styles.btn} ${isFullscreen ? styles.btnActive : ''}`}
          title={isFullscreen ? 'Show widgets' : 'Fullscreen map'}
          onClick={toggleFullscreen}
        >
          &#x26F6;
        </button>
        <button className={styles.btn} onClick={() => setShowInfo(true)}>
          &#9432;
        </button>
      </div>
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {showPasscode && <PasscodeModal onClose={() => setShowPasscode(false)} />}
    </div>
  );
}
