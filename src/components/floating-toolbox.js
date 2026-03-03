/**
 * FloatingToolbox — Draggable floating toolbox panel for fullscreen mode.
 * Wraps the existing toolbox widget content in a floating container.
 * Uses CSS transform: translate() for drag (same pattern as other floating panels).
 */
export class FloatingToolbox {
  constructor(centerEl) {
    this._centerEl = centerEl;
    this._tx = 0;
    this._ty = 0;

    this.panel = document.createElement('div');
    this.panel.className = 'iitc-dash-floating-toolbox';
    this.panel.style.display = 'none';

    // Drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'iitc-dash-ftb-drag-handle';
    dragHandle.textContent = 'TOOLBOX';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'iitc-dash-ftb-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => this.hide());
    dragHandle.appendChild(closeBtn);
    this.panel.appendChild(dragHandle);

    // Content area — will hold the toolbox widget's inner content
    this._content = document.createElement('div');
    this._content.className = 'iitc-dash-ftb-content';
    this.panel.appendChild(this._content);

    centerEl.appendChild(this.panel);

    // Drag binding
    this._onDragStart = this._onDragStart.bind(this);
    this._onDragMove = this._onDragMove.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
    dragHandle.addEventListener('mousedown', this._onDragStart);
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
    newTx = Math.max(centerRect.left - naturalLeft, Math.min(centerRect.right - naturalLeft - panelRect.width, newTx));
    newTy = Math.max(centerRect.top - naturalTop, Math.min(centerRect.bottom - naturalTop - panelRect.height, newTy));

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

  /**
   * Show the floating toolbox. Copies content from the real toolbox widget.
   */
  show() {
    this._copyToolboxContent();
    this.panel.style.display = 'flex';
    this.panel.style.transform = `translate(${this._tx}px, ${this._ty}px)`;
  }

  hide() {
    this.panel.style.display = 'none';
    if (this.onVisibilityChange) this.onVisibilityChange(false);
  }

  destroy() {
    this.hide();
    if (this.panel.parentNode) this.panel.remove();
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
  }

  _copyToolboxContent() {
    this._content.innerHTML = '';
    const links = [];
    const seen = new Set();

    ['toolbox_component', 'toolbox'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.querySelectorAll('a').forEach((a) => {
        const label = a.textContent.trim();
        if (label && !seen.has(label)) {
          seen.add(label);
          links.push({ label, el: a, title: a.title || label });
        }
      });
    });

    if (links.length === 0) {
      this._content.innerHTML = '<div class="iitc-dash-no-data">NO TOOLBOX</div>';
      return;
    }

    for (const link of links) {
      const item = document.createElement('div');
      item.className = 'iitc-dash-toolbox-item';
      item.textContent = link.label;
      item.title = link.title;
      item.style.cssText =
        'padding:3px 8px;font-size:10px;color:var(--text-primary);cursor:pointer;white-space:nowrap;background:var(--accent-06);border:1px solid var(--border);border-radius:2px;';
      item.addEventListener('click', () => link.el.click());
      item.addEventListener('mouseenter', () => {
        item.style.background = 'var(--accent-12)';
        item.style.color = 'var(--cyan)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'var(--accent-06)';
        item.style.color = 'var(--text-primary)';
      });
      this._content.appendChild(item);
    }
  }
}
