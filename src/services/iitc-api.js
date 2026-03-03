/**
 * IITCAPIAdapter — Bridge between IITC hooks and internal event bus
 * Source: ARCHITECTURE.md IITCAPIService (lines 670-772)
 *
 * Responsibilities:
 * - Poll/listen for IITC events via addHook()
 * - Convert IITC hook parameters to internal event format
 * - Emit events to EventBus for components to subscribe
 * - Cache last emitted data to prevent duplicate emissions
 * - Remove hooks on destroy() (if window.removeHook exists)
 *
 * NOTE: This is src/services/iitc-api.js — different from src/utils/iitc-api.js helper.
 */

/**
 * Debounce policies for IITC hook registrations.
 * 0 = fire immediately (low-frequency or one-time hooks)
 * >0 = coalesce rapid-fire events into a single call after N ms
 */
const HOOK_DEBOUNCE_POLICIES = {
  iitcLoaded: 0, // Fire immediately — only triggers once
  mapDataRefreshed: 50, // High-frequency during pan/zoom — batch to 50ms window
  playerStatsChanged: 0, // Low-frequency — fire immediately
  commUpdated: 100, // Fires per-message — batch to 100ms window
  moveend: 50, // Map pan/zoom end — batch to 50ms
};

export class IITCAPIAdapter {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.initialized = false;
    this.lastAgentData = null;
    this.lastPortalData = null;
    this.lastCommMessages = null;
    this.hookHandlers = []; // Track handlers for cleanup
    this.debounceTimers = {};
    this._moveDebounceTimer = null;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Hook: IITC fully loaded
    this._addHookWithDebounce('iitcLoaded', () => {
      this.eventBus.emit('iitc:loaded');
      this.emitAgentData();
      this.emitFactionData();
      this.emitPortalUpdates();
    });

    // Hook: Portal data changed
    this._addHookWithDebounce('mapDataRefreshed', () => {
      this.emitPortalUpdates();
    });

    // Hook: Agent data (level, AP) changed
    this._addHookWithDebounce('playerStatsChanged', () => {
      this.emitAgentData();
      this.emitFactionData();
    });

    // Hook: COMM message received
    if (window.addHook) {
      this._addHookWithDebounce('commUpdated', () => {
        this.emitCommMessages();
      });
    }

    // Map move (emit coordinates) — Leaflet event, not IITC hook; debounce inline
    if (window.map) {
      const moveHandler = () => {
        clearTimeout(this._moveDebounceTimer);
        this._moveDebounceTimer = setTimeout(() => {
          const center = window.map.getCenter();
          this.eventBus.emit('coords:changed', { lat: center.lat, lng: center.lng });
        }, HOOK_DEBOUNCE_POLICIES['moveend'] || 50);
      };
      window.map.on('moveend', moveHandler);
      this.hookHandlers.push({ type: 'map-moveend', handler: moveHandler });
    }

    // Initial emit
    this.emitAgentData();
    this.emitFactionData();
    this.emitPortalUpdates();
    this.emitCommMessages();
  }

  emitAgentData() {
    if (!window.PLAYER || !window.PLAYER.nickname) return;

    const agentData = {
      nickname: window.PLAYER.nickname,
      level: window.PLAYER.verified_level || 0,
      ap: window.PLAYER.ap || 0,
      team: window.PLAYER.team || 'unknown',
      verified: window.PLAYER.verified || false,
      energy: window.PLAYER.energy || 0,
      xm_capacity: window.PLAYER.xm_capacity || 0,
    };

    if (JSON.stringify(agentData) !== JSON.stringify(this.lastAgentData)) {
      this.lastAgentData = agentData;
      this.eventBus.emit('iitc:agentData', agentData);
    }
  }

  emitPortalUpdates() {
    const portals = Object.values(window.portals || {}).map((portal) => ({
      guid: portal.options.guid,
      name: portal.options.data.title,
      lat: portal.getLatLng().lat,
      lng: portal.getLatLng().lng,
      level: portal.options.data.level,
      team: portal.options.data.team,
      health: portal.options.data.health,
      resCount: portal.options.data.resCount,
      owner: portal.options.data.owner,
    }));

    if (JSON.stringify(portals) !== JSON.stringify(this.lastPortalData)) {
      this.lastPortalData = portals;
      this.eventBus.emit('iitc:portalsUpdated', portals);
    }
  }

  emitFactionData() {
    const factionData = {
      faction: window.PLAYER?.team || 'unknown',
      ap: window.factionData?.ap || 0,
      controlledPortals: window.factionData?.controlledPortals || 0,
    };

    this.eventBus.emit('iitc:factionDataRefreshed', factionData);
  }

  emitCommMessages() {
    const messages = (window.comm || []).map((msg) => ({
      guid: msg[0],
      timestamp: msg[1],
      text: msg[2],
      sender: msg[3],
      channel: msg[4],
    }));

    if (JSON.stringify(messages) !== JSON.stringify(this.lastCommMessages)) {
      this.lastCommMessages = messages;
      this.eventBus.emit('iitc:commUpdated', messages);
    }
  }

  _addHook(hookName, handler) {
    if (!window.addHook) return;
    window.addHook(hookName, handler);
    this.hookHandlers.push({ type: hookName, handler });
  }

  /**
   * Register a hook with automatic debouncing based on HOOK_DEBOUNCE_POLICIES.
   * For 0ms policies the handler fires immediately (no setTimeout overhead).
   * For >0ms policies the handler is wrapped in a debounce closure.
   */
  _addHookWithDebounce(hookName, handler) {
    const delayMs = HOOK_DEBOUNCE_POLICIES[hookName] ?? 0;
    if (delayMs === 0) {
      this._addHook(hookName, handler);
      return;
    }
    const debounced = (...args) => {
      clearTimeout(this.debounceTimers[hookName]);
      this.debounceTimers[hookName] = setTimeout(() => handler(...args), delayMs);
    };
    this._addHook(hookName, debounced);
  }

  destroy() {
    // Clear any pending debounce timers
    Object.values(this.debounceTimers).forEach((id) => clearTimeout(id));
    this.debounceTimers = {};
    clearTimeout(this._moveDebounceTimer);
    this._moveDebounceTimer = null;

    // Remove all registered hooks (if removeHook exists)
    if (window.removeHook) {
      this.hookHandlers.forEach(({ type, handler }) => {
        window.removeHook(type, handler);
      });
    }
    this.hookHandlers = [];
    this.initialized = false;
  }
}
