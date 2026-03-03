import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import styles from './portal-detail.module.css';

function teamClass(t) {
  if (t === 'E' || t === 1) return 'enl';
  if (t === 'R' || t === 2) return 'res';
  return 'neutral';
}

function getPortalData(guid) {
  const portal = (window.portals || {})[guid];
  if (!portal) return null;
  return portal.options && portal.options.data ? portal.options.data : null;
}

function getFullDetails(guid) {
  if (window.portalDetail && window.portalDetail.get) return window.portalDetail.get(guid);
  return null;
}

function XmBar({ label, value, pct }) {
  return (
    <div className={styles.xmBarContainer}>
      <div className={styles.xmBarLabel}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className={styles.xmBar}>
        <div className={styles.xmBarFill} style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} />
      </div>
    </div>
  );
}

function ResonatorGrid({ resos, team }) {
  const slots = [];
  for (let i = 0; i < 8; i++) {
    const r = resos[i];
    if (r) {
      const energy = r.energy || 0;
      const maxE = r.level ? r.level * 1000 : 1000;
      const pct = Math.round((energy / maxE) * 100);
      const rOwner = r.owner || '?';
      slots.push(
        <div
          key={i}
          className={`${styles.resoRow} ${styles.resoActive}`}
          title={`L${r.level} by ${rOwner} — ${pct}% (${energy}/${maxE} XM)`}
        >
          <div className={styles.resoCube}>
            <div className={styles.resoBg} style={{ height: pct + '%' }} />
            <div className={styles.resoLevel}>L{r.level}</div>
          </div>
          <div className={styles.resoInfo}>
            <div className={styles.resoPct}>{pct}%</div>
            <div className={`${styles.resoOwner} ${styles[team]}`}>{rOwner}</div>
          </div>
        </div>,
      );
    } else {
      slots.push(
        <div key={i} className={styles.resoRow} title="Empty slot">
          <div className={`${styles.resoCube} ${styles.resoCubeEmpty}`}>
            <div className={styles.resoLevel} style={{ color: 'var(--text-dim)' }}>
              —
            </div>
          </div>
        </div>,
      );
    }
  }
  return <div className={styles.resos}>{slots}</div>;
}

function ModGrid({ mods, team }) {
  const slots = [];
  for (let i = 0; i < 4; i++) {
    const mod = mods[i];
    if (mod) {
      const rarity = (mod.rarity || 'COMMON').toLowerCase().replace(/ /g, '_');
      const rarityLabel = (mod.rarity || 'COMMON').replace(/_/g, ' ');
      const mOwner = mod.owner || '?';
      let tip = `${rarityLabel} ${mod.name || 'MOD'}\nBy: ${mOwner}`;
      if (mod.stats) {
        for (const k in mod.stats) {
          if (Object.prototype.hasOwnProperty.call(mod.stats, k)) {
            tip += `\n+${mod.stats[k]} ${k.replace(/_/g, ' ')}`;
          }
        }
      }
      slots.push(
        <div key={i} className={`${styles.modSlot} ${styles.modFilled}`} title={tip}>
          <div className={styles.modName}>{mod.name || 'MOD'}</div>
          <div className={`${styles.modRarity} ${styles[rarity] || ''}`}>{rarityLabel}</div>
          <div className={`${styles.modOwner} ${styles[team]}`} title={mOwner}>
            {mOwner}
          </div>
        </div>,
      );
    } else {
      slots.push(
        <div key={i} className={styles.modSlot} title="Empty mod slot">
          <div className={styles.modName} style={{ color: 'var(--text-dim)' }}>
            —
          </div>
        </div>,
      );
    }
  }
  return <div className={styles.mods}>{slots}</div>;
}

export function PortalDetail() {
  const [portalState, setPortalState] = useState(null);

  const updatePortal = useCallback((data) => {
    const guid = data ? data.selectedPortalGuid : window.selectedPortal || null;
    if (!guid) {
      setPortalState(null);
      return;
    }
    const pd = getPortalData(guid);
    if (!pd) {
      setPortalState({ guid, loading: true });
      return;
    }
    const detail = getFullDetails(guid);
    setPortalState({ guid, pd, detail });
  }, []);

  useEffect(() => {
    const onSelect = (data) => updatePortal(data);
    const onDetails = () => updatePortal(null);

    if (window.addHook) {
      window.addHook('portalSelected', onSelect);
      window.addHook('portalDetailsUpdated', onDetails);
    }

    return () => {
      if (window.removeHook) {
        window.removeHook('portalSelected', onSelect);
        window.removeHook('portalDetailsUpdated', onDetails);
      }
    };
  }, [updatePortal]);

  if (!portalState) {
    return (
      <div className={styles.wrap}>
        <div className={styles.noData}>SELECT A PORTAL</div>
      </div>
    );
  }

  if (portalState.loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.noData}>LOADING...</div>
      </div>
    );
  }

  const { guid, pd, detail } = portalState;
  const team = teamClass(pd.team);
  const owner = (detail && detail.owner) || pd.owner || '';
  const health = pd.health || 0;
  const resos = (detail && detail.resonators) || pd.resonators || [];
  const mods = (detail && detail.mods) || pd.mods || [];

  let linksIn = 0,
    linksOut = 0;
  if (window.getPortalLinks) {
    const linkInfo = window.getPortalLinks(guid);
    linksIn = linkInfo.in.length;
    linksOut = linkInfo.out.length;
  }

  const hasBookmarksPlugin = window.plugin && window.plugin.bookmarks;
  const bkApi = window._iitcDashBookmarks;
  const isBookmarked = bkApi && bkApi.isPortalBookmarked(guid);

  function handleBookmarkToggle() {
    if (bkApi) {
      bkApi.toggleBookmark(guid);
      if (bkApi.onUpdate) bkApi.onUpdate();
    } else {
      const bk = window.plugin.bookmarks;
      if (bk && bk.switchStarPortal) bk.switchStarPortal(guid);
      if (bk && bk.saveStorage) bk.saveStorage();
    }
    if (window.runHooks) window.runHooks('pluginBkmrksEdit');
    updatePortal(null);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        {hasBookmarksPlugin && (
          <button
            className={`${styles.star} ${isBookmarked ? styles.starActive : ''}`}
            onClick={handleBookmarkToggle}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this portal'}
          >
            ★
          </button>
        )}
        <div className={`${styles.portalName} ${styles[team]}`} title={pd.title}>
          {pd.title || 'Unknown'}
        </div>
      </div>
      <div className={styles.columns}>
        {detail && detail.image && (
          <div className={styles.imageCol}>
            <img src={detail.image} alt={pd.title} className={styles.portalImg} />
          </div>
        )}
        <div className={styles.infoResoCol}>
          <div className={styles.info}>
            <div>LEVEL: {team === 'neutral' ? 0 : pd.level || 0}</div>
            {owner && (
              <div>
                OWNER: <span className={`${styles.ownerName} ${styles[team]}`}>{owner}</span>
              </div>
            )}
            <div>
              LINKS: <span title="Incoming">{linksIn} IN</span> / <span title="Outgoing">{linksOut} OUT</span>
            </div>
            <XmBar label="XM" value={health + '%'} pct={health} />
          </div>
          <ResonatorGrid resos={resos} team={team} />
        </div>
        <ModGrid mods={mods} team={team} />
      </div>
    </div>
  );
}
