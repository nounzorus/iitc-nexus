import { h } from 'preact';
import { Bookmarks } from './index.jsx';

export default { title: 'Widgets/Bookmarks', component: Bookmarks };

export const Default = () => {
  window.plugin = {
    bookmarks: {
      bkmrksObj: {
        portals: {
          Default: {
            bkmrk: {
              b1: { guid: 'p1', label: 'Tour Eiffel', latlng: '48.8584,2.2945' },
              b2: { guid: 'p2', label: 'Arc de Triomphe', latlng: '48.8738,2.295' },
            },
          },
        },
      },
    },
  };
  return <Bookmarks />;
};

export const Empty = () => {
  window.plugin = { bookmarks: { bkmrksObj: { portals: {} } } };
  return <Bookmarks />;
};
