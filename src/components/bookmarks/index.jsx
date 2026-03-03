import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import styles from './bookmarks.module.css';

function getPlugin() {
  return window.plugin && window.plugin.bookmarks ? window.plugin.bookmarks : null;
}

function getBookmarkedPortals() {
  const bk = getPlugin();
  if (!bk || !bk.bkmrksObj || !bk.bkmrksObj.portals) return [];
  const portals = [];
  const folders = bk.bkmrksObj.portals;
  for (const folderId in folders) {
    const folder = folders[folderId];
    const folderName = folder.label || 'Default';
    const bkmrks = folder.bkmrk || {};
    for (const id in bkmrks) {
      const b = bkmrks[id];
      const guid = b.guid || id;
      let label = '';
      if (window.portals && window.portals[guid]) {
        const pd = window.portals[guid].options && window.portals[guid].options.data;
        if (pd) label = pd.title || '';
      }
      if (!label) label = b.label || b.name || 'Unknown';
      portals.push({
        guid,
        label,
        folder: folderName,
        latlng: b.latlng ? b.latlng.split(',').map(Number) : null,
      });
    }
  }
  return portals;
}

function toggleBookmark(guid) {
  const bk = getPlugin();
  if (bk && bk.switchStarPortal) bk.switchStarPortal(guid);
}

function isPortalBookmarked(guid) {
  const bk = getPlugin();
  if (!bk || !bk.bkmrksObj || !bk.bkmrksObj.portals) return false;
  for (const fid in bk.bkmrksObj.portals) {
    const bkmrk = bk.bkmrksObj.portals[fid].bkmrk || {};
    for (const id in bkmrk) {
      if ((bkmrk[id].guid || id) === guid) return true;
    }
  }
  return false;
}

function addFolder() {
  const name = prompt('Folder name:');
  if (!name || !name.trim()) return;
  const bk = getPlugin();
  if (!bk || !bk.bkmrksObj || !bk.bkmrksObj.portals) return;
  const id = 'id' + Date.now();
  bk.bkmrksObj.portals[id] = { label: name.trim(), state: 1, bkmrk: {} };
  if (bk.saveStorage) bk.saveStorage();
  if (bk.refreshBkmrks) bk.refreshBkmrks();
}

export function Bookmarks() {
  const [expanded, setExpanded] = useState(true);
  const [portals, setPortals] = useState([]);
  const [hasPlugin, setHasPlugin] = useState(!!getPlugin());

  function refresh() {
    const bk = getPlugin();
    setHasPlugin(!!bk);
    if (bk) setPortals(getBookmarkedPortals());
  }

  useEffect(() => {
    refresh();

    const onEdit = () => refresh();
    const onLoaded = () => refresh();

    if (window.addHook) {
      window.addHook('pluginBkmrksEdit', onEdit);
      window.addHook('iitcLoaded', onLoaded);
    }

    return () => {
      if (window.removeHook) {
        window.removeHook('pluginBkmrksEdit', onEdit);
        window.removeHook('iitcLoaded', onLoaded);
      }
    };
  }, []);

  const byFolder = {};
  portals.forEach((p) => {
    (byFolder[p.folder] = byFolder[p.folder] || []).push(p);
  });

  return (
    <div className={`${styles.widget} iitc-dash-widget ${!expanded ? styles.collapsed : ''}`}>
      <div className={styles.header} onClick={() => setExpanded((e) => !e)}>
        <span>
          BOOKMARKS <span className={styles.tag}>{hasPlugin ? portals.length : '---'}</span>
        </span>
        <button
          className={styles.collapseBtn}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? '\u25B2' : '\u25BC'}
        </button>
      </div>
      {expanded && (
        <div className={styles.body}>
          {hasPlugin && (
            <div className={styles.actions}>
              <button
                className={styles.actionBtn}
                title="Bookmark the currently selected portal"
                onClick={() => {
                  const guid = window.selectedPortal;
                  if (!guid || isPortalBookmarked(guid)) return;
                  toggleBookmark(guid);
                  refresh();
                }}
              >
                + PORTAL
              </button>
              <button
                className={styles.actionBtn}
                title="Create a new bookmarks folder"
                onClick={() => {
                  addFolder();
                  refresh();
                }}
              >
                + FOLDER
              </button>
            </div>
          )}
          {!hasPlugin ? (
            <div className={styles.noData}>NO BOOKMARKS PLUGIN</div>
          ) : portals.length === 0 ? (
            <div className={styles.noData}>NO BOOKMARKS</div>
          ) : (
            Object.entries(byFolder).map(([folder, items]) => (
              <div key={folder} className={styles.folderGroup}>
                <div className={styles.folderHeader}>{folder}</div>
                {items.map((p) => (
                  <div
                    key={p.guid}
                    className={styles.item}
                    onClick={() => {
                      if (window.map && p.latlng && p.latlng[0]) {
                        window.map.setView([p.latlng[0], p.latlng[1]], window.map.getZoom());
                      }
                      if (window.renderPortalDetails) window.renderPortalDetails(p.guid);
                    }}
                  >
                    <span className={styles.icon}>★</span>
                    <span className={styles.name}>{p.label}</span>
                    <button
                      className={styles.removeBtn}
                      title="Remove bookmark"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(p.guid);
                        refresh();
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
