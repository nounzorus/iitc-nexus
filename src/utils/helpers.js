/**
 * Shared helpers for widget creation
 */

/** Create a widget container with header and collapse toggle */
export function createWidget(title, tag) {
  const w = document.createElement('div');
  w.className = 'iitc-dash-widget';
  const header = document.createElement('div');
  header.className = 'iitc-dash-widget-header';

  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  header.appendChild(titleSpan);

  if (tag) {
    const t = document.createElement('span');
    t.className = 'iitc-dash-tag';
    t.textContent = tag;
    header.appendChild(t);
  }

  // Collapse toggle
  const toggle = document.createElement('button');
  toggle.className = 'iitc-dash-collapse-btn';
  toggle.innerHTML = '&#x25B2;'; // up triangle = expanded
  toggle.title = 'Collapse';
  header.appendChild(toggle);

  const storageKey = 'iitc-dash-collapsed-' + title.replace(/\s+/g, '-').toLowerCase();

  function applyCollapsed(collapsed) {
    if (collapsed) {
      w.classList.add('collapsed');
      w.style.height = '35px';
    }
    toggle.innerHTML = collapsed ? '&#x25BC;' : '&#x25B2;';
    toggle.title = collapsed ? 'Expand' : 'Collapse';
  }

  // Restore saved state
  if (localStorage.getItem(storageKey) === '1') {
    applyCollapsed(true);
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!w.classList.contains('collapsed')) {
      w.dataset.expandedHeight = w.offsetHeight + 'px';
      w.style.height = w.offsetHeight + 'px';
      w.offsetHeight;
      w.classList.add('collapsed');
      w.style.height = '35px';
    } else {
      w.classList.remove('collapsed');
      w.style.height = w.dataset.expandedHeight || 'auto';
      const onEnd = () => {
        w.style.height = '';
        w.removeEventListener('transitionend', onEnd);
      };
      w.addEventListener('transitionend', onEnd);
    }
    const collapsed = w.classList.contains('collapsed');
    toggle.innerHTML = collapsed ? '&#x25BC;' : '&#x25B2;';
    toggle.title = collapsed ? 'Expand' : 'Collapse';
    localStorage.setItem(storageKey, collapsed ? '1' : '0');
  });

  w.appendChild(header);
  return w;
}

/** Create an XM bar (horizontal fill bar) */
export function createXmBar(label, valueText, percent, fillStyle) {
  const container = document.createElement('div');
  container.className = 'iitc-dash-xm-bar-container';
  const lbl = document.createElement('div');
  lbl.className = 'iitc-dash-xm-bar-label';
  lbl.innerHTML = `<span>${label}</span><span>${valueText}</span>`;
  container.appendChild(lbl);
  const bar = document.createElement('div');
  bar.className = 'iitc-dash-xm-bar';
  const fill = document.createElement('div');
  fill.className = 'iitc-dash-xm-bar-fill';
  fill.style.width = Math.min(100, Math.max(0, percent)) + '%';
  if (fillStyle) fill.style.background = fillStyle;
  bar.appendChild(fill);
  container.appendChild(bar);
  return container;
}

/** Create a stat cell (label + value) */
export function createStatCell(label, value, colorClass, tooltip) {
  const cell = document.createElement('div');
  cell.className = 'iitc-dash-stat-cell';
  if (tooltip) cell.title = tooltip;
  cell.innerHTML = `<div class="label">${label}</div><div class="value${colorClass ? ' ' + colorClass : ''}">${value}</div>`;
  return cell;
}

/** Create an SVG circle gauge */
export function createGauge(percent, label, colorClass) {
  const circumference = 2 * Math.PI * 16; // r=16
  const offset = circumference * (1 - percent / 100);
  const g = document.createElement('div');
  g.className = 'iitc-dash-gauge';
  g.innerHTML = `
    <svg viewBox="0 0 40 40">
      <circle class="bg" cx="20" cy="20" r="16"/>
      <circle class="fill${colorClass ? ' ' + colorClass : ''}" cx="20" cy="20" r="16"
        stroke-dasharray="${circumference.toFixed(1)}"
        stroke-dashoffset="${offset.toFixed(1)}"/>
    </svg>
    <div class="iitc-dash-gauge-label">
      <div class="gval">${percent}%</div>
      <div class="gname">${label}</div>
    </div>`;
  return g;
}

/** Set loading state on a widget */
export function setLoading(widget, loading) {
  if (loading) {
    widget.classList.add('iitc-dash-loading');
  } else {
    widget.classList.remove('iitc-dash-loading');
  }
}

/** Septicycle calculation */
export function getCycleInfo() {
  const CYCLE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const CHECKPOINT_INTERVAL = 5 * 60 * 60 * 1000; // 5 hours
  // Septicycles started at a known epoch: 2012-11-01T00:00:00Z
  const EPOCH = new Date('2012-11-01T00:00:00Z').getTime();
  const now = Date.now();
  const elapsed = now - EPOCH;
  const currentCycleStart = EPOCH + Math.floor(elapsed / CYCLE_DURATION) * CYCLE_DURATION;
  const cycleElapsed = now - currentCycleStart;
  const cycleRemaining = CYCLE_DURATION - cycleElapsed;
  const checkpointElapsed = cycleElapsed % CHECKPOINT_INTERVAL;
  const checkpointRemaining = CHECKPOINT_INTERVAL - checkpointElapsed;
  const checkpointNumber = Math.floor(cycleElapsed / CHECKPOINT_INTERVAL) + 1;

  const cycleEnd = currentCycleStart + CYCLE_DURATION;
  return { cycleRemaining, checkpointRemaining, checkpointNumber, cycleEnd };
}

/** Format milliseconds as HH:MM:SS */
export function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/** Format milliseconds as Xd HH:MM:SS */
export function formatTimeDays(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return (
    d +
    (d === 1 ? ' day ' : ' days ') +
    String(h).padStart(2, '0') +
    ':' +
    String(m).padStart(2, '0') +
    ':' +
    String(s).padStart(2, '0')
  );
}
