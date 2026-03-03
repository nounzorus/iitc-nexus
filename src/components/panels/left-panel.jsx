import { h } from 'preact';
import { PortalList } from '../portal-list/index.jsx';
import { Bookmarks } from '../bookmarks/index.jsx';
import { Toolbox } from '../toolbox/index.jsx';
import styles from './left-panel.module.css';

export function LeftPanel() {
  return (
    <div className={styles.panel} id="iitc-dash-left-panel">
      <PortalList />
      <Bookmarks />
      <Toolbox />
    </div>
  );
}
