import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { onRegionScoreUpdate } from '../../utils/region-score.js';
import styles from './cell-stats.module.css';

function formatMU(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export function CellStats() {
  const [stats, setStats] = useState(null);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('iitc-dash-collapsed-cell-stats') === '1');

  useEffect(() => {
    const unsub = onRegionScoreUpdate((data) => {
      if (data) {
        const lastCPScore = data.lastCPScore || [0, 0];
        setStats({
          enlMu: data.totalScore ? data.totalScore[0] : 0,
          resMu: data.totalScore ? data.totalScore[1] : 0,
          lastCP: data.lastCP ?? 0,
          lastCPEnl: lastCPScore[0] ?? 0,
          lastCPRes: lastCPScore[1] ?? 0,
          regionName: data.regionName || '',
        });
      }
    });
    return unsub;
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('iitc-dash-collapsed-cell-stats', next ? '1' : '0');
      return next;
    });
  }

  return (
    <div className={`${styles.widget} iitc-dash-widget ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header} onClick={toggleCollapse}>
        <span>CELL STATS</span>
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
        <div className={styles.body}>
          {!stats ? (
            <div className={styles.noData}>AWAITING CELL DATA...</div>
          ) : (
            <>
              {stats.regionName && (
                <div className={styles.regionName} title="Current S2 cell region">
                  {stats.regionName}
                </div>
              )}
              <div className={`${styles.statRow} ${styles.enl}`}>
                <span className={styles.label}>ENL TOTAL MU</span>
                <span className={styles.value}>{formatMU(stats.enlMu)}</span>
              </div>
              <div className={`${styles.statRow} ${styles.res}`}>
                <span className={styles.label}>RES TOTAL MU</span>
                <span className={styles.value}>{formatMU(stats.resMu)}</span>
              </div>
              <div className={styles.sep} />
              <div className={styles.statRow}>
                <span className={styles.label}>LAST CP</span>
                <span className={styles.value}>#{stats.lastCP}</span>
              </div>
              <div className={`${styles.statRow} ${styles.enl}`}>
                <span className={styles.label}>ENL CP MU</span>
                <span className={styles.value}>{formatMU(stats.lastCPEnl)}</span>
              </div>
              <div className={`${styles.statRow} ${styles.res}`}>
                <span className={styles.label}>RES CP MU</span>
                <span className={styles.value}>{formatMU(stats.lastCPRes)}</span>
              </div>
              <div className={styles.sep} />
              <button
                className={styles.viewMore}
                onClick={() => {
                  const link = document.querySelector(
                    '#toolbox a[title*="Region"], #toolbox_component a[title*="Region"], #toolbox a[onclick*="regionScore"], #toolbox_component a[onclick*="regionScore"]',
                  );
                  if (link) {
                    link.click();
                    return;
                  }
                  const allLinks = document.querySelectorAll('#toolbox a, #toolbox_component a');
                  for (const a of allLinks) {
                    if (a.textContent.toLowerCase().includes('region score')) {
                      a.click();
                      return;
                    }
                  }
                }}
              >
                VIEW MORE
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
