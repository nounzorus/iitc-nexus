import { h } from 'preact';
import { portals$ } from '../../services/iitc-signals.js';
import { PortalList } from './index.jsx';

export default { title: 'Widgets/PortalList', component: PortalList };

function mockWindowPortals() {
  const entries = [
    { guid: 'p1', title: 'Tour Eiffel', team: 1, level: 8, health: 95, lat: 48.8584, lng: 2.2945 },
    { guid: 'p2', title: 'Arc de Triomphe', team: 2, level: 6, health: 60, lat: 48.8738, lng: 2.295 },
    { guid: 'p3', title: 'Sacré-Cœur', team: 0, level: 0, health: 0, lat: 48.8867, lng: 2.343 },
    { guid: 'p4', title: 'Louvre Pyramid', team: 1, level: 7, health: 80, lat: 48.8606, lng: 2.3376 },
    { guid: 'p5', title: 'Notre-Dame', team: 2, level: 5, health: 45, lat: 48.853, lng: 2.3499 },
    { guid: 'p6', title: 'Panthéon', team: 1, level: 4, health: 70, lat: 48.8462, lng: 2.3464 },
    { guid: 'p7', title: 'Place de la Concorde', team: 0, level: 0, health: 0, lat: 48.8656, lng: 2.3212 },
    { guid: 'p8', title: 'Opéra Garnier', team: 2, level: 3, health: 30, lat: 48.8719, lng: 2.3316 },
  ];

  const portals = {};
  for (const e of entries) {
    portals[e.guid] = {
      options: {
        data: { title: e.title, team: e.team === 1 ? 'E' : e.team === 2 ? 'R' : 'N', level: e.level, health: e.health },
      },
      getLatLng: () => ({ lat: e.lat, lng: e.lng }),
    };
  }
  window.portals = portals;
  window.map = {
    getCenter: () => ({
      lat: 48.8566,
      lng: 2.3522,
      distanceTo: (ll) => Math.sqrt((ll.lat - 48.8566) ** 2 + (ll.lng - 2.3522) ** 2) * 111000,
    }),
    getZoom: () => 15,
    on: () => {},
    off: () => {},
  };
  portals$.value = entries;
}

export const Default = () => {
  mockWindowPortals();
  return <PortalList />;
};

export const Empty = () => {
  window.portals = {};
  portals$.value = [];
  return <PortalList />;
};
