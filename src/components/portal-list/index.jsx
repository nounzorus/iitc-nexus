import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { portals$ } from '../../services/iitc-signals.js';
import { useIITCHook } from '../../hooks/use-iitc-hook.js';
import styles from './portal-list.module.css';

function formatDist(meters) {
  if (meters < 1000) return Math.round(meters) + 'm';
  return (meters / 1000).toFixed(1) + 'km';
}

function getCenter() {
  return window.map ? window.map.getCenter() : null;
}

function computePortalList(portalsSignalValue) {
  const raw = window.portals || {};
  const center = getCenter();
  const list = [];

  for (const guid in raw) {
    const p = raw[guid];
    const data = p.options && p.options.data;
    if (!data || !data.title) continue;
    const ll = p.getLatLng ? p.getLatLng() : null;
    if (!ll) continue;
    const dist = center ? center.distanceTo(ll) : 0;
    let team = 'neutral';
    if (data.team === 'E' || data.team === 1) team = 'enl';
    else if (data.team === 'R' || data.team === 2) team = 'res';
    const level = team === 'neutral' ? 0 : Math.floor(data.level || 0);
    list.push({ guid, title: data.title, level, team, distance: dist });
  }

  list.sort((a, b) => a.distance - b.distance);
  return list;
}

export function PortalList() {
  const portalsSignal = useIITCHook(portals$);
  const [portals, setPortals] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState(null);

  function refresh() {
    setPortals(computePortalList(portalsSignal));
  }

  useEffect(() => {
    refresh();

    function onRefreshEnd() {
      refresh();
    }
    function onPortalAdded() {
      clearTimeout(onPortalAdded._t);
      onPortalAdded._t = setTimeout(refresh, 300);
    }

    const onLoaded = () => {
      if (window.map) {
        window.map.on('moveend zoomend', refresh);
      }
      setTimeout(refresh, 1000);
    };

    if (window.addHook) {
      window.addHook('mapDataRefreshEnd', onRefreshEnd);
      window.addHook('portalAdded', onPortalAdded);
      window.addHook('iitcLoaded', onLoaded);
    }
    if (window.map) {
      window.map.on('moveend zoomend', refresh);
    }

    return () => {
      if (window.removeHook) {
        window.removeHook('mapDataRefreshEnd', onRefreshEnd);
        window.removeHook('portalAdded', onPortalAdded);
        window.removeHook('iitcLoaded', onLoaded);
      }
      if (window.map) {
        window.map.off('moveend zoomend', refresh);
      }
    };
  }, []);

  useEffect(() => {
    refresh();
  }, [portalsSignal]);

  let filtered = portals;
  if (levelFilter !== null) filtered = filtered.filter((p) => p.level === levelFilter);
  if (search) filtered = filtered.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`${styles.widget} iitc-dash-widget ${!expanded ? styles.collapsed : ''}`}>
      <div className={styles.header} onClick={() => setExpanded((e) => !e)}>
        <span>
          PORTALS{' '}
          <span className={styles.tag}>
            {filtered.length}/{portals.length}
          </span>
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
          <input
            className={styles.search}
            type="text"
            placeholder="Search portals..."
            value={search}
            onInput={(e) => setSearch(e.target.value)}
          />
          <div className={styles.levelFilters}>
            <button
              className={`${styles.lvlBtn} ${levelFilter === null ? styles.lvlActive : ''}`}
              onClick={() => setLevelFilter(null)}
            >
              ALL
            </button>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((l) => (
              <button
                key={l}
                className={`${styles.lvlBtn} ${levelFilter === l ? styles.lvlActive : ''}`}
                onClick={() => setLevelFilter(levelFilter === l ? null : l)}
              >
                L{l}
              </button>
            ))}
          </div>
          <div className={styles.list}>
            {filtered.length === 0 ? (
              <div className={styles.noData}>NO PORTALS</div>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.guid}
                  className={`${styles.item} ${styles[p.team]}`}
                  onClick={() => {
                    const raw = window.portals && window.portals[p.guid];
                    if (raw) {
                      const ll = raw.getLatLng();
                      if (window.map && ll) window.map.setView(ll, window.map.getZoom());
                    }
                    if (window.renderPortalDetails) window.renderPortalDetails(p.guid);
                  }}
                >
                  <span className={styles.lvl}>L{p.level}</span>
                  <span className={styles.name} title={p.title}>
                    {p.title}
                  </span>
                  <span className={styles.dist}>{formatDist(p.distance)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
