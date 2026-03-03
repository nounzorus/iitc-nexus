import { createXmBar } from '../utils/helpers.js';

// Inlined helpers
function getPortals() {
  return window.portals || {};
}
function getPortalData(guid) {
  const portals = getPortals();
  const portal = portals[guid];
  if (!portal) return null;
  return portal.options && portal.options.data ? portal.options.data : null;
}
function getSelectedPortalGuid() {
  return window.selectedPortal || null;
}
function teamClass(t) {
  if (t === 'E' || t === 1) return 'enl';
  if (t === 'R' || t === 2) return 'res';
  return 'neutral';
}

export class FloatingPortalDetail {
  constructor(centerEl) {
    this._centerEl = centerEl;
    this._tx = 0;
    this._ty = 0;
    this._hooks = [];

    // Main panel
    this.panel = document.createElement('div');
    this.panel.className = 'iitc-dash-floating-portal-detail';
    this.panel.style.display = 'none';

    // Drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'iitc-dash-fpd-drag-handle';
    dragHandle.textContent = 'PORTAL DETAIL';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'iitc-dash-fpd-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => this.hide());
    dragHandle.appendChild(closeBtn);
    this.panel.appendChild(dragHandle);

    // Content area
    this._content = document.createElement('div');
    this._content.className = 'iitc-dash-fpd-content';
    this._content.innerHTML = '<div class="iitc-dash-no-data">SELECT A PORTAL</div>';
    this.panel.appendChild(this._content);

    centerEl.appendChild(this.panel);

    // Bind drag
    this._onDragStart = this._onDragStart.bind(this);
    this._onDragMove = this._onDragMove.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
    dragHandle.addEventListener('mousedown', this._onDragStart);
    this._dragHandle = dragHandle;

    // Bound hook handlers
    this._onPortalSelected = (data) => this.update(data);
    this._onPortalDetailsUpdated = () => this.update(null);
  }

  _onDragStart(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    this._dragging = true;
    this._startMouseX = e.clientX;
    this._startMouseY = e.clientY;
    this._startTx = this._tx;
    this._startTy = this._ty;
    document.addEventListener('mousemove', this._onDragMove);
    document.addEventListener('mouseup', this._onDragEnd);
  }

  _onDragMove(e) {
    if (!this._dragging) return;
    const dx = e.clientX - this._startMouseX;
    const dy = e.clientY - this._startMouseY;
    let newTx = this._startTx + dx;
    let newTy = this._startTy + dy;

    // Clamp within centerEl bounds
    const centerRect = this._centerEl.getBoundingClientRect();
    const panelRect = this.panel.getBoundingClientRect();
    // Panel's natural position (without transform) — we need to clamp newTx/newTy
    // such that the panel stays within centerEl
    const naturalLeft = panelRect.left - this._tx;
    const naturalTop = panelRect.top - this._ty;
    const minTx = centerRect.left - naturalLeft;
    const maxTx = centerRect.right - naturalLeft - panelRect.width;
    const minTy = centerRect.top - naturalTop;
    const maxTy = centerRect.bottom - naturalTop - panelRect.height;
    newTx = Math.max(minTx, Math.min(maxTx, newTx));
    newTy = Math.max(minTy, Math.min(maxTy, newTy));

    this.panel.style.transform = `translate(${newTx}px, ${newTy}px)`;
    // Store tentative values for use in mouseup
    this._pendingTx = newTx;
    this._pendingTy = newTy;
  }

  _onDragEnd() {
    if (!this._dragging) return;
    this._dragging = false;
    if (this._pendingTx !== undefined) {
      this._tx = this._pendingTx;
      this._ty = this._pendingTy;
    }
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
  }

  show() {
    this.panel.style.display = 'block';
    this.panel.style.transform = `translate(${this._tx}px, ${this._ty}px)`;
    this.update(null);
    if (window.addHook) {
      window.addHook('portalSelected', this._onPortalSelected);
      window.addHook('portalDetailsUpdated', this._onPortalDetailsUpdated);
    }
    this._hooks = [
      { type: 'portalSelected', fn: this._onPortalSelected },
      { type: 'portalDetailsUpdated', fn: this._onPortalDetailsUpdated },
    ];
  }

  hide() {
    this.panel.style.display = 'none';
    this._hooks.forEach(({ type, fn }) => {
      if (window.removeHook) {
        window.removeHook(type, fn);
      }
    });
    this._hooks = [];
  }

  destroy() {
    this.hide();
    if (this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
  }

  update(data) {
    const guid = data ? data.selectedPortalGuid : getSelectedPortalGuid();
    if (!guid) {
      this._content.innerHTML = '<div class="iitc-dash-no-data">SELECT A PORTAL</div>';
      return;
    }
    const pd = getPortalData(guid);
    if (!pd) {
      this._content.innerHTML = '<div class="iitc-dash-no-data">LOADING...</div>';
      return;
    }

    const detail = window.portalDetail && window.portalDetail.get ? window.portalDetail.get(guid) : null;
    const team = teamClass(pd.team);
    const health = pd.health || 0;
    const level = pd.level || 0;
    const owner = (detail && detail.owner) || pd.owner || '';

    this._content.innerHTML = '';

    // Title row
    const titleRow = document.createElement('div');
    titleRow.className = 'iitc-dash-pd-title-row';
    const bkApi = window._iitcDashBookmarks;
    const isBk = bkApi && bkApi.isPortalBookmarked(guid);
    const hasBookmarksPlugin = window.plugin && window.plugin.bookmarks;
    titleRow.innerHTML = `
      ${hasBookmarksPlugin ? `<button class="iitc-dash-pd-star ${isBk ? 'active' : ''}" title="${isBk ? 'Remove bookmark' : 'Bookmark this portal'}">&#9733;</button>` : ''}
      <div class="iitc-dash-portal-name ${team}" title="${pd.title || ''}">${pd.title || 'Unknown'}</div>`;
    if (hasBookmarksPlugin) {
      titleRow.querySelector('.iitc-dash-pd-star').addEventListener('click', () => {
        if (bkApi) {
          bkApi.toggleBookmark(guid);
          if (bkApi.onUpdate) bkApi.onUpdate();
        } else {
          const bk = window.plugin.bookmarks;
          if (bk && bk.switchStarPortal) bk.switchStarPortal(guid);
          if (bk && bk.saveStorage) bk.saveStorage();
        }
        // Trigger pluginBkmrksEdit hook so Bookmarks panel refreshes
        if (window.runHooks) window.runHooks('pluginBkmrksEdit');
        this.update(null);
      });
    }
    this._content.appendChild(titleRow);

    // Image (if available)
    if (detail && detail.image) {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'iitc-dash-pd-image';
      imgDiv.innerHTML = `<img src="${detail.image}" alt="${pd.title || ''}" />`;
      this._content.appendChild(imgDiv);
    }

    // Info section
    let linksIn = 0,
      linksOut = 0;
    if (window.getPortalLinks) {
      const linkInfo = window.getPortalLinks(guid);
      linksIn = linkInfo.in.length;
      linksOut = linkInfo.out.length;
    }
    const info = document.createElement('div');
    info.className = 'iitc-dash-pd-info';
    info.innerHTML =
      `<div class="iitc-dash-portal-level">LEVEL: ${level}</div>` +
      (owner
        ? `<div class="iitc-dash-portal-owner">OWNER: <span class="owner-name ${team}">${owner}</span></div>`
        : '') +
      `<div class="iitc-dash-portal-links">LINKS: <span class="link-in" title="Incoming">${linksIn} IN</span> / <span class="link-out" title="Outgoing">${linksOut} OUT</span></div>`;
    info.appendChild(createXmBar('XM', health + '%', health));
    this._content.appendChild(info);

    // Resonators (2col x 4row)
    const resos = (detail && detail.resonators) || pd.resonators || [];
    const resoGrid = document.createElement('div');
    resoGrid.className = 'iitc-dash-pd-resos';
    for (let i = 0; i < 8; i++) {
      const r = resos[i];
      const cell = document.createElement('div');
      cell.className = 'iitc-dash-reso-row' + (r ? ' active' : '');
      if (r) {
        const energy = r.energy || 0;
        const maxE = r.level ? r.level * 1000 : 1000;
        const pct = Math.round((energy / maxE) * 100);
        const rOwner = r.owner || '?';
        cell.title = `L${r.level} by ${rOwner} — ${pct}% (${energy}/${maxE} XM)`;
        cell.innerHTML = `<div class="reso-cube"><div class="reso-bg" style="height:${pct}%"></div><div class="reso-level">L${r.level}</div></div>
          <div class="reso-info"><div class="reso-pct">${pct}%</div><div class="reso-owner ${team}">${rOwner}</div></div>`;
      } else {
        cell.title = 'Empty slot';
        cell.innerHTML =
          '<div class="reso-cube empty"><div class="reso-level" style="color:var(--text-dim)">—</div></div>';
      }
      resoGrid.appendChild(cell);
    }
    this._content.appendChild(resoGrid);

    // Mods (2x2)
    const mods = (detail && detail.mods) || pd.mods || [];
    const modGrid = document.createElement('div');
    modGrid.className = 'iitc-dash-pd-mods';
    for (let i = 0; i < 4; i++) {
      const mod = mods[i];
      const slot = document.createElement('div');
      slot.className = 'iitc-dash-mod-slot' + (mod ? ' filled' : '');
      if (mod) {
        const rarity = (mod.rarity || 'COMMON').toLowerCase().replace(/ /g, '_');
        const rarityLabel = (mod.rarity || 'COMMON').replace(/_/g, ' ');
        const mOwner = mod.owner || '?';
        let tip = `${rarityLabel} ${mod.name || 'MOD'}\nBy: ${mOwner}`;
        if (mod.stats) {
          for (const k in mod.stats) {
            if (Object.prototype.hasOwnProperty.call(mod.stats, k)) tip += `\n+${mod.stats[k]} ${k.replace(/_/g, ' ')}`;
          }
        }
        slot.title = tip;
        slot.innerHTML = `<div class="mod-name">${mod.name || 'MOD'}</div>
          <div class="mod-rarity ${rarity}">${rarityLabel}</div>
          <div class="reso-owner ${team}" title="${mOwner}">${mOwner}</div>`;
      } else {
        slot.title = 'Empty mod slot';
        slot.innerHTML = '<div class="mod-name" style="color:var(--text-dim)">—</div>';
      }
      modGrid.appendChild(slot);
    }
    this._content.appendChild(modGrid);
  }
}
