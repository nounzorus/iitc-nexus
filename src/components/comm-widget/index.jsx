import { h } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import styles from './comm-widget.module.css';

function makeMessageKey(m) {
  return `${m.dateStr}|${m.time}|${m.agent}|${m.faction}|${m.action.slice(0, 40)}`;
}

function parseMarkup(markup) {
  let agentName = '',
    faction = '';
  const actionParts = [];
  const actionHtmlParts = [];

  markup.forEach((part) => {
    if (part[0] === 'SENDER') {
      agentName = part[1].plain || '';
      faction = (part[1].team || '').toUpperCase().includes('ENLI') ? 'enl' : 'res';
    } else if (part[0] === 'TEXT') {
      const txt = part[1].plain || '';
      actionParts.push(txt);
      actionHtmlParts.push(txt);
    } else if (part[0] === 'PORTAL') {
      const pName = part[1].name || part[1].plain || '';
      const latE6 = part[1].latE6;
      const lngE6 = part[1].lngE6;
      if (latE6 && lngE6) {
        const link = `<a class="iitc-dash-comm-portal" data-lat="${latE6}" data-lng="${lngE6}" title="Zoom to portal">${pName}</a>`;
        actionParts.push(link);
        actionHtmlParts.push(link);
      } else {
        actionParts.push(pName);
        actionHtmlParts.push(pName);
      }
    } else if (part[0] === 'PLAYER') {
      if (!agentName) {
        agentName = part[1].plain || '';
        faction = (part[1].team || '').toUpperCase().includes('ENLI') ? 'enl' : 'res';
      } else {
        const pName = part[1].plain || '';
        const pFaction = (part[1].team || '').toUpperCase().includes('ENLI') ? 'enl' : 'res';
        actionParts.push(pName);
        actionHtmlParts.push(`<span class="${styles.player} ${styles['agent_' + pFaction]}">${pName}</span>`);
      }
    } else {
      const txt = (part[1] && part[1].plain) || '';
      actionParts.push(txt);
      actionHtmlParts.push(txt);
    }
  });

  return { agentName, faction, action: actionParts.join('').trim(), actionHtml: actionHtmlParts.join('').trim() };
}

function CommEntry({ msg }) {
  const actionText = msg.actionHtml || msg.action;
  const agentSpan = `<span class="${styles.player} ${styles['agent_' + msg.faction]}">${msg.agent}</span>`;

  let html;
  if (actionText.trimEnd().endsWith(' by')) {
    html = `<span class="${styles.time}" title="${msg.fullTime}">${msg.time}</span><span class="${styles.action}">${actionText.trimEnd()} ${agentSpan}</span>`;
  } else if (msg.isAlert) {
    html = `<span class="${styles.time}" title="${msg.fullTime}">${msg.time}</span><span class="${styles.action}">${actionText}</span>${agentSpan}`;
  } else {
    html = `<span class="${styles.time}" title="${msg.fullTime}">${msg.time}</span>${agentSpan}<span class="${styles.action}">${actionText}</span>`;
  }

  return <div className={styles.entry} data-date-str={msg.dateStr} dangerouslySetInnerHTML={{ __html: html }} />;
}

function DateSeparator({ date }) {
  return <div className={styles.dateSep}>{date}</div>;
}

export function CommWidget() {
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState({ all: [], faction: [], alerts: [] });
  const [loaded, setLoaded] = useState({ all: false, faction: false, alerts: false });
  const [expanded, setExpanded] = useState(false);
  const logRef = useRef(null);
  const seenKeysRef = useRef(new Set());
  const wasAtBottomRef = useRef(true);

  const processChat = useCallback((data, tab) => {
    setLoaded((prev) => ({ ...prev, [tab]: true }));
    if (!data || !data.result) return;
    const entries = data.result;
    if (!Array.isArray(entries) || entries.length === 0) return;

    const newMsgs = [];
    entries.forEach((entry) => {
      const markup = entry[2] && entry[2].plext && entry[2].plext.markup;
      if (!markup) return;
      const { agentName, faction, action, actionHtml } = parseMarkup(markup);
      if (!agentName) return;

      const d = new Date(entry[1]);
      const time = d.toTimeString().slice(0, 5);
      const fullTime = d.toLocaleString();
      const dateStr = d.toLocaleDateString();
      const msg = {
        time,
        fullTime,
        dateStr,
        agent: agentName,
        faction,
        action,
        actionHtml,
        ts: entry[1],
        isAlert: tab === 'alerts',
      };
      const key = makeMessageKey(msg);
      const seenKey = tab + '|' + key;

      if (!seenKeysRef.current.has(seenKey)) {
        seenKeysRef.current.add(seenKey);
        newMsgs.push(msg);
      }
    });

    if (newMsgs.length > 0) {
      setMessages((prev) => {
        const updated = [...prev[tab], ...newMsgs];
        updated.sort((a, b) => a.ts - b.ts);
        return { ...prev, [tab]: updated };
      });
    }
  }, []);

  const clearAllMessages = useCallback(() => {
    setMessages({ all: [], faction: [], alerts: [] });
    setLoaded({ all: false, faction: false, alerts: false });
    seenKeysRef.current.clear();
  }, []);

  useEffect(() => {
    const hookPublic = (data) => processChat(data, 'all');
    const hookFaction = (data) => processChat(data, 'faction');
    const hookAlerts = (data) => processChat(data, 'alerts');

    if (window.addHook) {
      window.addHook('publicChatDataAvailable', hookPublic);
      window.addHook('factionChatDataAvailable', hookFaction);
      window.addHook('alertsChatDataAvailable', hookAlerts);
    }

    const onMapMove = () => clearAllMessages();
    if (window.map) window.map.on('moveend', onMapMove);
    const iitcLoaded = () => {
      if (window.map) window.map.on('moveend', onMapMove);
    };
    if (window.addHook) window.addHook('iitcLoaded', iitcLoaded);

    return () => {
      if (window.removeHook) {
        window.removeHook('publicChatDataAvailable', hookPublic);
        window.removeHook('factionChatDataAvailable', hookFaction);
        window.removeHook('alertsChatDataAvailable', hookAlerts);
        window.removeHook('iitcLoaded', iitcLoaded);
      }
      if (window.map) window.map.off('moveend', onMapMove);
    };
  }, [processChat, clearAllMessages]);

  // Auto-scroll to bottom on new messages for active tab
  useEffect(() => {
    if (logRef.current && wasAtBottomRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  function handleScroll() {
    if (!logRef.current) return;
    const el = logRef.current;
    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (el.scrollTop < 200) {
      const channelMap = { all: 'requestPublic', faction: 'requestFaction', alerts: 'requestAlerts' };
      const fn = channelMap[activeTab];
      if (window.chat && window.chat[fn]) window.chat[fn](true);
    }
  }

  function handleTabClick(tab) {
    setActiveTab(tab);
    wasAtBottomRef.current = true;
    if (window.chat && window.chat.chooseTab) window.chat.chooseTab(tab);
  }

  function handlePortalClick(e) {
    const link = e.target.closest('.iitc-dash-comm-portal');
    if (!link) return;
    const lat = parseInt(link.dataset.lat, 10) / 1e6;
    const lng = parseInt(link.dataset.lng, 10) / 1e6;
    if (window.map) window.map.setView([lat, lng], 17);
  }

  function closeModal() {
    setExpanded(false);
  }

  const msgs = messages[activeTab] || [];

  // Group messages with date separators
  const renderItems = [];
  let lastDate = '';
  let isFirst = true;
  for (const msg of msgs) {
    if (msg.dateStr && msg.dateStr !== lastDate) {
      if (!isFirst) renderItems.push({ type: 'sep', date: msg.dateStr });
      lastDate = msg.dateStr;
      isFirst = false;
    }
    renderItems.push({ type: 'msg', msg });
  }

  const tabBar = (
    <div className={styles.tabs}>
      {['all', 'faction', 'alerts'].map((tab) => (
        <button
          key={tab}
          className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
          onClick={() => handleTabClick(tab)}
        >
          {tab.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const logContent =
    msgs.length === 0 ? (
      <div className={styles.noData}>{loaded[activeTab] ? 'NO MESSAGES' : 'LOADING COMM...'}</div>
    ) : (
      renderItems.map((item, i) =>
        item.type === 'sep' ? (
          <DateSeparator key={'sep-' + i} date={item.date} />
        ) : (
          <CommEntry key={makeMessageKey(item.msg)} msg={item.msg} />
        ),
      )
    );

  const logEl = (
    <div ref={logRef} className={styles.log} onScroll={handleScroll} onClick={handlePortalClick}>
      {logContent}
    </div>
  );

  return (
    <>
      <div className={styles.widget}>
        <div className={styles.header}>
          <span>
            COMM <span className={styles.tag}>{activeTab.toUpperCase()}</span>
          </span>
          <button className={styles.expandBtn} onClick={() => setExpanded(true)} title="Open COMM in fullscreen modal">
            &#x26F6;
          </button>
        </div>
        {!expanded && tabBar}
        {!expanded && logEl}
      </div>
      {expanded && (
        <div
          className={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              COMM <span className={styles.tag}>{activeTab.toUpperCase()}</span>
              <button className={styles.closeBtn} onClick={closeModal}>
                &times;
              </button>
            </div>
            {tabBar}
            {logEl}
          </div>
        </div>
      )}
    </>
  );
}
