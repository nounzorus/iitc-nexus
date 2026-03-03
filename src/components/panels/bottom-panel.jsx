import { h } from 'preact';
import { CommWidget } from '../comm-widget/index.jsx';
import { PortalDetail } from '../portal-detail/index.jsx';
import styles from './bottom-panel.module.css';

export function BottomPanel() {
  return (
    <div className={styles.panel} id="iitc-dash-bottom-panel">
      <CommWidget />
      <PortalDetail />
    </div>
  );
}
