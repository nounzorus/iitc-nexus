import { signal, computed } from '@preact/signals';

export const portals$ = signal([]);
export const commMessages$ = signal([]);
export const agentData$ = signal({ nickname: '?', level: 0, ap: 0, team: 'unknown', verified: false });
export const factionData$ = signal({ faction: 'unknown', ap: 0, controlledPortals: 0 });
export const selectedPortal$ = signal(null);
export const theme$ = signal(
  typeof localStorage !== 'undefined' ? localStorage.getItem('iitc-dash-theme') || 'res' : 'res',
);

export const portalCount$ = computed(() => portals$.value.length);
export const isEnlightened$ = computed(() => agentData$.value.team === 'ENLIGHTENED');

export function updateFromIITC(eventName, data) {
  switch (eventName) {
    case 'iitc:portalsUpdated':
      portals$.value = data;
      break;
    case 'iitc:commUpdated':
      commMessages$.value = data;
      break;
    case 'iitc:agentData':
      agentData$.value = data;
      break;
    case 'iitc:factionDataRefreshed':
      factionData$.value = data;
      break;
    case 'theme:changed':
      theme$.value = data.theme;
      if (typeof localStorage !== 'undefined') localStorage.setItem('iitc-dash-theme', data.theme);
      break;
  }
}
