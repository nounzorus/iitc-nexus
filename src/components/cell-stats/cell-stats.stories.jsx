import { h } from 'preact';
import { CellStats } from './index.jsx';
import { setRegionData } from '../../utils/region-score.js';

export default { title: 'Widgets/CellStats', component: CellStats };

export const Default = () => {
  setRegionData({
    regionName: 'FR04-ALPHA-07',
    totalScore: [4250000, 3890000],
    lastCP: 12,
    lastCPScore: [320000, 285000],
  });
  return <CellStats />;
};

export const NoData = () => {
  setRegionData(null);
  return <CellStats />;
};
