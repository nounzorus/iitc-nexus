import { h } from 'preact';
import { Toolbox } from './index.jsx';

export default { title: 'Widgets/Toolbox', component: Toolbox };

export const Default = () => {
  const tb = document.getElementById('toolbox');
  if (!tb) {
    const el = document.createElement('div');
    el.id = 'toolbox';
    el.innerHTML = '<a onclick="">Portal Count</a><a onclick="">Draw Tools</a><a onclick="">Bookmarks</a>';
    document.body.appendChild(el);
  }
  return <Toolbox />;
};
