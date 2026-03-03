import '../src/styles/tokens.css';
import '../src/styles/dashboard.css';

// Load Google Fonts used by the dashboard
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700&display=swap';
document.head.appendChild(fontLink);

// Mock IITC globals
window.portals = {};
window.map = { getCenter: () => ({ lat: 48.8566, lng: 2.3522 }), getZoom: () => 15, getBounds: () => ({ contains: () => true }), on: () => {}, off: () => {} };
window.addHook = () => {};
window.removeHook = () => {};
window.chat = { _public: { data: {} }, _faction: { data: {} }, _alerts: { data: {} } };
window.selectedPortal = null;
window.plugin = { bookmarks: { bkmrksObj: { portals: {} } } };
window.TEAM_ENL = 2;
window.TEAM_RES = 1;

export const decorators = [
  (Story, context) => {
    const size = context.parameters?.size || 'panel';
    const sizes = {
      panel: { width: '280px', minHeight: '400px' },
      bottom: { width: '100%', height: '280px' },
      topbar: { width: '100%' },
      full: { width: '100%', minHeight: '80vh' },
    };
    const s = sizes[size] || sizes.panel;
    return (
      <div
        class="iitc-dashboard"
        style={{
          position: 'relative',
          display: 'block',
          inset: 'auto',
          minHeight: '100vh',
          padding: '1rem',
          background: 'var(--bg-primary)',
        }}
      >
        <div style={s}>
          <Story />
        </div>
      </div>
    );
  },
];
