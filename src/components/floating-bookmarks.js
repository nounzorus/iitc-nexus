/**
 * FloatingBookmarks — Draggable floating bookmarks panel for fullscreen mode.
 * Uses CSS transform: translate() for drag (same pattern as FloatingPortalDetail).
 */
export class FloatingBookmarks {
  constructor(centerEl) {
    this._centerEl = centerEl;
    this._tx = 0;
    this._ty = 0;

    this.panel = document.createElement('div');
    this.panel.className = 'iitc-dash-floating-bookmarks';
    this.panel.style.display = 'none';

    // Drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'iitc-dash-fbk-drag-handle';
    dragHandle.textContent = 'BOOKMARKS';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'iitc-dash-fbk-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => this.hide());
    dragHandle.appendChild(closeBtn);
    this.panel.appendChild(dragHandle);

    // Content
    this._content = document.createElement('div');
    this._content.className = 'iitc-dash-fbk-content';
    this._content.innerHTML = '<div class="iitc-dash-no-data">NO BOOKMARKS</div>';
    this.panel.appendChild(this._content);

    centerEl.appendChild(this.panel);

    // Drag binding
    this._onDragStart = this._onDragStart.bind(this);
    this._onDragMove = this._onDragMove.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
    dragHandle.addEventListener('mousedown', this._onDragStart);
    this._dragHandle = dragHandle;
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

    const centerRect = this._centerEl.getBoundingClientRect();
    const panelRect = this.panel.getBoundingClientRect();
    const naturalLeft = panelRect.left - this._tx;
    const naturalTop = panelRect.top - this._ty;
    const minTx = centerRect.left - naturalLeft;
    const maxTx = centerRect.right - naturalLeft - panelRect.width;
    const minTy = centerRect.top - naturalTop;
    const maxTy = centerRect.bottom - naturalTop - panelRect.height;
    newTx = Math.max(minTx, Math.min(maxTx, newTx));
    newTy = Math.max(minTy, Math.min(maxTy, newTy));

    this.panel.style.transform = `translate(${newTx}px, ${newTy}px)`;
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
    this.panel.style.display = 'flex';
    this.panel.style.transform = `translate(${this._tx}px, ${this._ty}px)`;
    this._refresh();
    this._attachHooks();
  }

  hide() {
    this.panel.style.display = 'none';
    this._detachHooks();
    if (this.onVisibilityChange) this.onVisibilityChange(false);
  }

  destroy() {
    this.hide();
    if (this.panel.parentNode) this.panel.remove();
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
  }

  _attachHooks() {
    if (this._hooked) return;
    this._hooked = true;
    this._boundRefresh = () => this._refresh();

    // Listen for bookmark edits (add/remove/rename)
    if (window.addHook) {
      window.addHook('pluginBkmrksEdit', this._boundRefresh);
    }

    // Also chain into the dashboard bookmark API's onUpdate
    const bkApi = window._iitcDashBookmarks;
    if (bkApi) {
      this._prevOnUpdate = bkApi.onUpdate;
      bkApi.onUpdate = () => {
        if (this._prevOnUpdate) this._prevOnUpdate();
        this._boundRefresh();
      };
    }
  }

  _detachHooks() {
    if (!this._hooked) return;
    this._hooked = false;

    if (window.removeHook && this._boundRefresh) {
      window.removeHook('pluginBkmrksEdit', this._boundRefresh);
    }

    // Restore previous onUpdate
    const bkApi = window._iitcDashBookmarks;
    if (bkApi && this._prevOnUpdate !== undefined) {
      bkApi.onUpdate = this._prevOnUpdate;
      this._prevOnUpdate = undefined;
    }
  }

  _refresh() {
    const bk = window.plugin && window.plugin.bookmarks;
    if (!bk || !bk.bkmrksObj || !bk.bkmrksObj.portals) {
      this._content.innerHTML = '<div class="iitc-dash-no-data">NO BOOKMARKS PLUGIN</div>';
      return;
    }
    const portals = bk.bkmrksObj.portals;
    const folders = Object.keys(portals);
    if (folders.length === 0) {
      this._content.innerHTML = '<div class="iitc-dash-no-data">NO BOOKMARKS</div>';
      return;
    }

    this._content.innerHTML = '';
    for (const folderId of folders) {
      const folder = portals[folderId];
      const folderLabel = folder.label || 'Unnamed';
      const bkmrks = folder.bkmrk || {};
      const entries = Object.keys(bkmrks);
      if (entries.length === 0) continue;

      const folderDiv = document.createElement('div');
      folderDiv.style.marginBottom = '6px';
      folderDiv.innerHTML = `<div style="font-weight:bold;letter-spacing:0.5px;margin-bottom:2px;color:var(--accent-primary)">${folderLabel}</div>`;

      for (const bId of entries) {
        const b = bkmrks[bId];
        const row = document.createElement('div');
        row.style.cssText = 'padding:2px 0;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        row.style.cssText += 'display:flex;align-items:center;gap:4px;';

        const label = document.createElement('span');
        label.textContent = b.label || 'Unknown';
        label.title = b.label || '';
        label.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;';
        label.addEventListener('click', () => {
          if (b.latlng) {
            const [lat, lng] = b.latlng.split(',').map(Number);
            if (window.map && !isNaN(lat)) window.map.setView([lat, lng], 17);
          }
        });
        row.appendChild(label);

        const delBtn = document.createElement('button');
        delBtn.textContent = '✕';
        delBtn.title = 'Remove bookmark';
        delBtn.style.cssText = 'background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:10px;padding:0 2px;flex-shrink:0;';
        delBtn.addEventListener('mouseenter', () => { delBtn.style.color = 'var(--red, #e83040)'; });
        delBtn.addEventListener('mouseleave', () => { delBtn.style.color = 'var(--text-dim)'; });
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const guid = b.guid || bId;
          const bkApi = window._iitcDashBookmarks;
          if (bkApi && bkApi.toggleBookmark) {
            bkApi.toggleBookmark(guid);
            if (bkApi.onUpdate) bkApi.onUpdate();
          } else {
            const bk = window.plugin && window.plugin.bookmarks;
            if (bk && bk.switchStarPortal) bk.switchStarPortal(guid);
            if (bk && bk.saveStorage) bk.saveStorage();
          }
          this._refresh();
        });
        row.appendChild(delBtn);

        row.addEventListener('mouseenter', () => { label.style.color = 'var(--accent-primary)'; });
        row.addEventListener('mouseleave', () => { label.style.color = ''; });
        folderDiv.appendChild(row);
      }
      this._content.appendChild(folderDiv);
    }
  }
}
