import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { onRegionScoreUpdate } from '../../utils/region-score.js';
import styles from './top-agents.module.css';

export function TopAgents() {
  const [agents, setAgents] = useState([]);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('iitc-dash-collapsed-top-agents') === '1');

  useEffect(() => {
    const unsub = onRegionScoreUpdate((data) => {
      if (data?.topAgents?.length > 0) setAgents(data.topAgents);
      else setAgents([]);
    });
    return unsub;
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('iitc-dash-collapsed-top-agents', next ? '1' : '0');
      return next;
    });
  }

  return (
    <div className={`${styles.widget} iitc-dash-widget ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header} onClick={toggleCollapse}>
        <span>TOP AGENTS</span>
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
          {agents.length === 0 ? (
            <div className={styles.noData}>NO AGENT DATA</div>
          ) : (
            agents.map((agent, i) => {
              const faction = (agent.team || '').toUpperCase().includes('RESI') ? 'res' : 'enl';
              return (
                <div
                  key={i}
                  className={styles.agentRow}
                  title={`${faction === 'res' ? 'Resistance' : 'Enlightened'} agent — rank #${i + 1}`}
                >
                  <span className={styles.rank}>#{i + 1}</span>
                  <span className={`${styles.nick} ${styles[faction]}`}>{agent.nick}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
