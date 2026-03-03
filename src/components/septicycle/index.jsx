import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getCycleInfo, formatTime, formatTimeDays } from '../../utils/helpers.js';
import styles from './septicycle.module.css';

export function Septicycle() {
  const [cycleData, setCycleData] = useState(() => getCycleInfo());
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('iitc-dash-collapsed-septicycle') === '1');

  useEffect(() => {
    function tick() {
      setCycleData(getCycleInfo());
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('iitc-dash-collapsed-septicycle', next ? '1' : '0');
      return next;
    });
  }

  const cycleEndDate = new Date(cycleData.cycleEnd);
  const cycleEndStr =
    cycleEndDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' & ' +
    cycleEndDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`${styles.widget} iitc-dash-widget ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header} onClick={toggleCollapse}>
        <span>SEPTICYCLE</span>
        <button
          className={styles.collapseBtn}
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
        >
          {collapsed ? '\u25BC' : '\u25B2'}
        </button>
      </div>
      {!collapsed && (
        <div className={styles.timer}>
          <div className={styles.cycleLabel}>NEXT CHECKPOINT</div>
          <div className={styles.cycleTime} title="Time remaining until next checkpoint scoring">
            {formatTime(cycleData.checkpointRemaining)}
          </div>
          <div className={styles.cycleSub} title="Current checkpoint number out of 35 per cycle">
            CHECKPOINT {cycleData.checkpointNumber}/35
          </div>
          <div className={styles.sep} />
          <div className={styles.cycleLabel} style={{ marginTop: '6px' }}>
            CYCLE END
          </div>
          <div className={styles.cycleEndTime} title="Time remaining until the 7-day septicycle ends">
            {formatTimeDays(cycleData.cycleRemaining)}
          </div>
          <div className={styles.cycleEndDate}>{cycleEndStr}</div>
        </div>
      )}
    </div>
  );
}
