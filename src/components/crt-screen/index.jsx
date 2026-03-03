import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from './crt-screen.module.css';

export function CrtScreen({ onDismiss }) {
  const barRef = useRef(null);
  const statusRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    async function runSequence() {
      await delay(1200);
      if (cancelled) return;

      if (statusRef.current) statusRef.current.textContent = 'SYSTEMS ONLINE';
      if (barRef.current) barRef.current.style.width = '100%';

      await delay(800);
      if (cancelled) return;

      if (rootRef.current) rootRef.current.classList.add(styles.bootOut);
      onDismiss();
    }

    runSequence();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.bootScreen}>
      <div className={styles.bootContent}>
        <div className={styles.bootLogo}>IITC</div>
        <div className={styles.bootSub}>NEXUS UI DASHBOARD</div>
        <div className={styles.bootBar}>
          <div ref={barRef} className={styles.bootBarFill} />
        </div>
        <div ref={statusRef} className={styles.bootStatus}>
          INITIALIZING SYSTEMS...
        </div>
      </div>
    </div>
  );
}
