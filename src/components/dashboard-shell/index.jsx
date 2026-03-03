import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { theme$ } from '../../services/iitc-signals.js';
import { CrtScreen } from '../crt-screen/index.jsx';
import { Topbar } from '../topbar/index.jsx';
import { LeftPanel } from '../panels/left-panel.jsx';
import { RightPanel } from '../panels/right-panel.jsx';
import { BottomPanel } from '../panels/bottom-panel.jsx';
import styles from './dashboard-shell.module.css';

function setupResize(dashboard, panel, side) {
  const handle = document.createElement('div');
  handle.className = 'iitc-dash-resize-handle ' + side;
  panel.appendChild(handle);

  let startX, startWidth;
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startWidth = panel.getBoundingClientRect().width;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  function onMove(e) {
    const delta = side === 'left' ? e.clientX - startX : startX - e.clientX;
    const newWidth = Math.max(200, Math.min(500, startWidth + delta));
    const cols =
      side === 'left'
        ? `${newWidth}px 1fr ${dashboard.style.gridTemplateColumns ? dashboard.style.gridTemplateColumns.split(' ')[2] : '280px'}`
        : `${dashboard.style.gridTemplateColumns ? dashboard.style.gridTemplateColumns.split(' ')[0] : '280px'} 1fr ${newWidth}px`;
    dashboard.style.gridTemplateColumns = cols;
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }

  return () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
}

function setupBottomResize(panel) {
  const handle = document.createElement('div');
  handle.className = 'iitc-dash-resize-handle-bottom';
  panel.appendChild(handle);

  let startX, startWidth;
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startWidth = panel.getBoundingClientRect().width;
    document.addEventListener('mousemove', onMoveH);
    document.addEventListener('mouseup', onUpH);
  });
  function onMoveH(e) {
    const delta = e.clientX - startX;
    const newWidth = Math.max(300, startWidth + delta);
    panel.style.width = newWidth + 'px';
    panel.style.gridColumn = 'auto';
  }
  function onUpH() {
    document.removeEventListener('mousemove', onMoveH);
    document.removeEventListener('mouseup', onUpH);
  }

  const vHandle = document.createElement('div');
  vHandle.className = 'iitc-dash-resize-handle-bottom-v';
  panel.appendChild(vHandle);

  let startY, startHeight;
  vHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startY = e.clientY;
    startHeight = panel.getBoundingClientRect().height;
    document.addEventListener('mousemove', onMoveV);
    document.addEventListener('mouseup', onUpV);
  });
  function onMoveV(e) {
    const delta = startY - e.clientY;
    const newHeight = Math.max(80, Math.min(600, startHeight + delta));
    const dashboard = panel.closest('.iitc-dashboard, [id="iitc-dash-root"]');
    if (dashboard) {
      dashboard.style.gridTemplateRows = `42px 1fr ${newHeight}px`;
    }
  }
  function onUpV() {
    document.removeEventListener('mousemove', onMoveV);
    document.removeEventListener('mouseup', onUpV);
    if (window.map && window.map.invalidateSize) window.map.invalidateSize();
  }

  return () => {
    document.removeEventListener('mousemove', onMoveH);
    document.removeEventListener('mouseup', onUpH);
    document.removeEventListener('mousemove', onMoveV);
    document.removeEventListener('mouseup', onUpV);
  };
}

export function DashboardShell() {
  const [showCrt, setShowCrt] = useState(true);
  const [dashVisible, setDashVisible] = useState(false);
  const dashRef = useRef(null);

  // Apply theme class from signal once on mount; topbar handles changes
  useEffect(() => {
    const theme = theme$.value;
    if (dashRef.current && theme === 'enl') {
      dashRef.current.classList.add('theme-enl');
    }
  }, []);

  // Move #map into center cell on mount
  useEffect(() => {
    const center = document.getElementById('iitc-dash-center');
    const mapEl = document.getElementById('map');
    if (center && mapEl) {
      mapEl.style.position = 'absolute';
      mapEl.style.inset = '0';
      mapEl.style.width = '100%';
      mapEl.style.height = '100%';
      center.appendChild(mapEl);
      setTimeout(() => {
        if (window.map && window.map.invalidateSize) window.map.invalidateSize();
      }, 200);
    }
  }, []);

  // Resize handles — panels are null in 17A stub; null guards prevent errors
  useEffect(() => {
    const leftPanel = document.getElementById('iitc-dash-left-panel');
    const rightPanel = document.getElementById('iitc-dash-right-panel');
    const bottomPanel = document.getElementById('iitc-dash-bottom-panel');

    const cleanups = [];

    if (leftPanel) cleanups.push(setupResize(dashRef.current, leftPanel, 'left'));
    if (rightPanel) cleanups.push(setupResize(dashRef.current, rightPanel, 'right'));
    if (bottomPanel) cleanups.push(setupBottomResize(bottomPanel));

    return () => cleanups.forEach((fn) => fn && fn());
  }, []);

  function handleCrtDismiss() {
    setDashVisible(true);
    setTimeout(() => setShowCrt(false), 1200);
  }

  return (
    <>
      {showCrt && <CrtScreen onDismiss={handleCrtDismiss} />}
      <div
        ref={dashRef}
        className={`${styles.dashboard} iitc-dashboard`}
        id="iitc-dash-root"
        style={{ opacity: dashVisible ? 1 : 0, visibility: dashVisible ? 'visible' : 'hidden' }}
      >
        <Topbar />
        <LeftPanel />
        <div id="iitc-dash-center" className={styles.center} />
        <RightPanel />
        <BottomPanel />
        <div className={styles.scanline} />
      </div>
    </>
  );
}
