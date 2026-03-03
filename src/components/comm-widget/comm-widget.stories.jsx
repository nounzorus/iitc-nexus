import { h } from 'preact';
import { commMessages$ } from '../../services/iitc-signals.js';
import { CommWidget } from './index.jsx';

export default { title: 'Widgets/CommWidget', component: CommWidget, parameters: { size: 'bottom' } };

const mockMessages = [
  {
    dateStr: '2025-01-15',
    time: '14:32',
    agent: 'Agent1',
    faction: 'RES',
    action: 'deployed a Resonator on Tour Eiffel',
    markup: [],
  },
  { dateStr: '2025-01-15', time: '14:30', agent: 'Agent2', faction: 'ENL', action: 'captured Sacré-Cœur', markup: [] },
  {
    dateStr: '2025-01-15',
    time: '14:28',
    agent: 'Agent3',
    faction: 'RES',
    action: 'linked Arc de Triomphe to Tour Eiffel',
    markup: [],
  },
];

export const Default = () => {
  commMessages$.value = mockMessages;
  return <CommWidget />;
};

export const Empty = () => {
  commMessages$.value = [];
  return <CommWidget />;
};
