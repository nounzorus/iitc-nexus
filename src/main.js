import { h, render } from 'preact';
import { DashboardShell } from './components/dashboard-shell/index.jsx';
import tokensCSS from './styles/tokens.css?raw';
import dashboardCSS from './styles/dashboard.css?raw';
import { EventBus } from './services/event-bus.js';
import { ReactiveStore } from './services/reactive-store.js';
import { TimerManager } from './services/timer-manager.js';
import { IITCAPIAdapter } from './services/iitc-api.js';
import { updateFromIITC } from './services/iitc-signals.js';

// ─── Phase 7: Service singletons ───────────────────────────────────────────
const eventBus = new EventBus();

const store = new ReactiveStore({
  agent: { nickname: '?', level: 0, ap: 0, team: 'unknown' },
  portals: [],
  theme: localStorage.getItem('iitc-dash-theme') || 'res',
  commMessages: [],
  selectedPortal: null,
});

const timerManager = new TimerManager();
const iitcAdapter = new IITCAPIAdapter(eventBus);

// Expose services globally for component access
window.__iitcDash = { eventBus, store, timerManager, iitcAdapter };

async function setup() {
  // Inject Google Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href =
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap';
  document.head.appendChild(fontLink);

  // Inject CSS via <style> tag (works in IITC plugin context, no GM_addStyle needed)
  const style = document.createElement('style');
  style.textContent = tokensCSS + '\n' + dashboardCSS;
  document.head.appendChild(style);

  // Mount Preact root
  const root = document.createElement('div');
  root.id = 'iitc-dash-preact-root';
  document.body.appendChild(root);
  render(h(DashboardShell, null), root);

  // ─── Phase 7: Service bootstrap via IITC hook ──────────────────────────────
  const onIitcLoaded = () => {
    // Bridge adapter events into ReactiveStore (MUST register BEFORE init)
    eventBus.on('iitc:agentData', (data) => {
      store.state.agent = data;
    });
    eventBus.on('iitc:portalsUpdated', (data) => {
      store.state.portals = data;
    });
    eventBus.on('iitc:commUpdated', (data) => {
      store.state.commMessages = data;
    });
    eventBus.on('iitc:factionDataRefreshed', (data) => {
      store.state.factionData = data;
    });

    // Bridge: EventBus events → signal updates (for Preact components)
    eventBus.on('iitc:agentData', (data) => updateFromIITC('iitc:agentData', data));
    eventBus.on('iitc:portalsUpdated', (data) => updateFromIITC('iitc:portalsUpdated', data));
    eventBus.on('iitc:commUpdated', (data) => updateFromIITC('iitc:commUpdated', data));
    eventBus.on('iitc:factionDataRefreshed', (data) => updateFromIITC('iitc:factionDataRefreshed', data));
    eventBus.on('theme:changed', (data) => updateFromIITC('theme:changed', data));

    // Start IITC adapter (registers hooks, emits initial data)
    iitcAdapter.init();

    // Auto-detect faction theme (only if user hasn't manually chosen)
    const userThemePref = localStorage.getItem('iitc-dash-theme');
    if (!userThemePref && window.PLAYER && window.PLAYER.team) {
      const faction = window.PLAYER.team; // 'RESISTANCE', 'ENLIGHTENED', or 'ALIENS'
      const autoTheme = faction === 'ENLIGHTENED' ? 'enl' : 'res';
      store.state.theme = autoTheme;
      localStorage.setItem('iitc-dash-theme', autoTheme);
      updateFromIITC('theme:changed', { theme: autoTheme });
    }

    // Apply resolved theme to dashboard root
    const resolvedTheme = store.state.theme;
    const dashRoot = document.querySelector('.iitc-dashboard');
    if (dashRoot) {
      dashRoot.classList.toggle('theme-enl', resolvedTheme === 'enl');
    }
    // Also fire an event so topbar can sync its button label
    window.__iitcDash.eventBus.emit('theme:applied', { theme: resolvedTheme });

    // Restore last map position & zoom
    const savedView = localStorage.getItem('iitc-dash-map-view');
    if (savedView && window.map) {
      const { lat, lng, zoom } = JSON.parse(savedView);
      window.map.setView([lat, lng], zoom);
    }
    // Save position on move
    if (window.map) {
      window.map.on('moveend', () => {
        const c = window.map.getCenter();
        localStorage.setItem(
          'iitc-dash-map-view',
          JSON.stringify({ lat: c.lat, lng: c.lng, zoom: window.map.getZoom() }),
        );
      });
    }
  };

  // Register hook — but also handle case where iitcLoaded already fired
  if (window.addHook) {
    window.addHook('iitcLoaded', onIitcLoaded);
    // If IITC already loaded before our hook registered, fire immediately
    if (window.PLAYER && window.PLAYER.nickname) {
      onIitcLoaded();
    }
  }

  // Custom tooltips — replace native title tooltips inside dashboard
  let tip = null;
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[title]');
    if (!el || !el.closest('.iitc-dashboard')) return;
    const text = el.getAttribute('title');
    if (!text) return;
    el.dataset.tip = text;
    el.removeAttribute('title');
    tip = document.createElement('div');
    tip.className = 'iitc-dash-tooltip';
    tip.textContent = text;
    document.body.appendChild(tip);
    const r = el.getBoundingClientRect();
    tip.style.left = r.left + 'px';
    tip.style.top = r.top - tip.offsetHeight - 4 + 'px';
  });
  document.addEventListener('mouseout', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el) {
      el.setAttribute('title', el.dataset.tip);
      delete el.dataset.tip;
    }
    if (tip) {
      tip.remove();
      tip = null;
    }
  });
}

// Export setup for the IITC wrapper to pick up
export { setup };
