import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import styles from './toolbox.module.css';

function getToolboxLinks() {
  const links = [];
  const seen = new Set();

  ['toolbox_component', 'toolbox'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.querySelectorAll('a').forEach((a) => {
      const label = a.textContent.trim();
      if (label && !seen.has(label)) {
        seen.add(label);
        links.push({ label, el: a, title: a.title || label });
      }
    });
  });

  return links;
}

export function Toolbox() {
  const [links, setLinks] = useState([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    function sync() {
      setLinks(getToolboxLinks());
    }

    sync();

    const observers = [];
    ['toolbox', 'toolbox_component'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new MutationObserver(sync);
      obs.observe(el, { childList: true, subtree: true, characterData: true });
      observers.push(obs);
    });

    if (window.addHook) {
      window.addHook('iitcLoaded', sync);
    }
    const t1 = setTimeout(sync, 3000);
    const t2 = setTimeout(sync, 8000);

    return () => {
      observers.forEach((o) => o.disconnect());
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (links.length === 0) return null;

  return (
    <div className={`${styles.widget} iitc-dash-widget ${!expanded ? styles.collapsed : ''}`}>
      <div className={styles.header} onClick={() => setExpanded((e) => !e)}>
        <span>
          TOOLBOX <span className={styles.tag}>{links.length}</span>
        </span>
        <button
          className={styles.collapseBtn}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? '\u25B2' : '\u25BC'}
        </button>
      </div>
      {expanded && (
        <div className={styles.body}>
          {links.map((link, i) => (
            <div key={i} className={styles.item} title={link.title} onClick={() => link.el.click()}>
              {link.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
