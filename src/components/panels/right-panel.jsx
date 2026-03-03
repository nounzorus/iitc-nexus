import { h } from 'preact';
import { TopAgents } from '../top-agents/index.jsx';
import { Septicycle } from '../septicycle/index.jsx';
import { CellStats } from '../cell-stats/index.jsx';
import styles from './right-panel.module.css';

export function RightPanel() {
  return (
    <div className={styles.panel} id="iitc-dash-right-panel">
      <TopAgents />
      <Septicycle />
      <CellStats />
    </div>
  );
}
