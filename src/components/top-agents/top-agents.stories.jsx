import { h } from 'preact';
import { TopAgents } from './index.jsx';
import { setRegionData } from '../../utils/region-score.js';

export default { title: 'Widgets/TopAgents', component: TopAgents };

export const Default = () => {
  setRegionData({
    regionName: 'FR04-ALPHA-07',
    totalScore: [0, 0],
    lastCP: 0,
    lastCPScore: [0, 0],
    topAgents: [
      { nick: 'AgentVert', team: 'ENLIGHTENED' },
      { nick: 'BlueStrike', team: 'RESISTANCE' },
      { nick: 'XMHunter', team: 'ENLIGHTENED' },
    ],
  });
  return <TopAgents />;
};

export const Empty = () => {
  setRegionData({
    regionName: '',
    totalScore: [0, 0],
    lastCP: 0,
    lastCPScore: [0, 0],
    topAgents: [],
  });
  return <TopAgents />;
};
