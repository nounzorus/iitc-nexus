import { h } from 'preact';
import { PortalDetail } from './index.jsx';

export default { title: 'Widgets/PortalDetail', component: PortalDetail, parameters: { size: 'bottom' } };

function setupPortalMocks(guid, portalData, detailData) {
  window.portals = {
    [guid]: {
      options: { data: portalData },
      getLatLng: () => ({ lat: 48.8584, lng: 2.2945 }),
    },
  };
  window.portalDetail = {
    get: (g) => (g === guid ? detailData : null),
  };
  window.selectedPortal = guid;
  window.getPortalLinks = () => ({ in: [1, 2, 3], out: [1, 2] });
  window.addHook = (name, cb) => {
    if (name === 'portalSelected') cb({ selectedPortalGuid: guid });
  };
  window.removeHook = () => {};
}

export const EnlPortal = () => {
  setupPortalMocks(
    'p1',
    {
      title: 'Tour Eiffel',
      team: 'E',
      level: 8,
      health: 92,
      owner: 'AgentVert',
    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
      owner: 'AgentVert',
      resonators: [
        { level: 8, energy: 6000, owner: 'AgentVert' },
        { level: 8, energy: 5500, owner: 'XMHunter' },
        { level: 7, energy: 4200, owner: 'FrogMaster' },
        { level: 7, energy: 4000, owner: 'AgentVert' },
        { level: 6, energy: 3000, owner: 'NeoFrog' },
        { level: 6, energy: 2800, owner: 'GreenOps' },
        { level: 5, energy: 2000, owner: 'XMHunter' },
        { level: 5, energy: 1500, owner: 'AgentVert' },
      ],
      mods: [
        { name: 'AXA Shield', rarity: 'VERY_RARE', owner: 'AgentVert' },
        { name: 'Multi-hack', rarity: 'RARE', owner: 'XMHunter' },
        null,
        { name: 'Force Amp', rarity: 'RARE', owner: 'FrogMaster' },
      ],
    },
  );
  return (
    <div style="max-width:949px">
      <PortalDetail />
    </div>
  );
};

export const ResPortal = () => {
  setupPortalMocks(
    'p2',
    {
      title: 'Arc de Triomphe',
      team: 'R',
      level: 6,
      health: 58,
      owner: 'BlueStrike',
    },
    {
      image:
        'https://lh3.googleusercontent.com/gps-cs-s/AHVAweo9t106vgAsqu0J2e64yfo9sDwDTXwJLG7Gq-q0J0RMowh8PWB4MG2eTDEDhlrKVwQxjW01aEoGJGUNAav2BiUABnMC_H15REBf9yNzKWUyM-_hl6xGiQ6YZRGSP-hUlBZJpX8=s680-w680-h510-rw',
      owner: 'BlueStrike',
      resonators: [
        { level: 7, energy: 4000, owner: 'BlueStrike' },
        { level: 6, energy: 3200, owner: 'CyanAgent' },
        { level: 6, energy: 2900, owner: 'BlueStrike' },
        { level: 5, energy: 2000, owner: 'ResOps42' },
        { level: 5, energy: 1800, owner: 'CyanAgent' },
        null,
        null,
        null,
      ],
      mods: [
        { name: 'Portal Shield', rarity: 'COMMON', owner: 'BlueStrike' },
        null,
        null,
        { name: 'Heat Sink', rarity: 'VERY_RARE', owner: 'CyanAgent' },
      ],
    },
  );
  return (
    <div style="max-width:949px">
      <PortalDetail />
    </div>
  );
};

export const NoPortal = () => {
  window.portals = {};
  window.selectedPortal = null;
  window.addHook = () => {};
  window.removeHook = () => {};
  return (
    <div style="max-width:949px">
      <PortalDetail />
    </div>
  );
};
