import { agentData$, theme$ } from '../../services/iitc-signals.js';
import { Topbar } from './index.jsx';

export default { title: 'Widgets/Topbar', component: Topbar, parameters: { size: 'topbar' } };

export const Resistance = () => {
  theme$.value = 'res';
  agentData$.value = { nickname: 'TestAgent', level: 12, ap: 84000000, team: 'RESISTANCE', verified: true };
  return <Topbar />;
};

export const Enlightened = () => {
  theme$.value = 'enl';
  agentData$.value = { nickname: 'TestAgent', level: 10, ap: 40000000, team: 'ENLIGHTENED', verified: true };
  return (
    <div class="theme-enl">
      <Topbar />
    </div>
  );
};
