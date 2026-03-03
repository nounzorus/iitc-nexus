/**
 * Region Score Service — fetches and caches region score data from IITC API
 */

let cachedData = null;
let lastFetchCenter = null;
const listeners = [];

export function onRegionScoreUpdate(cb) {
  listeners.push(cb);
  if (cachedData) cb(cachedData);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notify() {
  listeners.forEach((cb) => cb(cachedData));
}

export function fetchRegionScore() {
  const map = window.map;
  if (!map || !window.postAjax) return;
  const c = map.getCenter();
  const latE6 = Math.round(c.lat * 1e6);
  const lngE6 = Math.round(c.lng * 1e6);

  // Don't re-fetch if we haven't moved much
  if (lastFetchCenter) {
    const dlat = Math.abs(latE6 - lastFetchCenter.lat);
    const dlng = Math.abs(lngE6 - lastFetchCenter.lng);
    if (dlat < 50000 && dlng < 50000 && cachedData) return;
  }

  lastFetchCenter = { lat: latE6, lng: lngE6 };

  window.postAjax(
    'getRegionScoreDetails',
    { latE6, lngE6 },
    (data) => {
      if (!data || !data.result) return;
      const r = data.result;

      // Parse checkpoints from scoreHistory
      const checkpoints = [];
      if (r.scoreHistory) {
        for (const h of r.scoreHistory) {
          checkpoints[parseInt(h[0])] = [parseInt(h[1]), parseInt(h[2])];
        }
      }

      // Compute total (sum of all CPs)
      let totalEnl = 0,
        totalRes = 0;
      for (let i = 1; i < checkpoints.length; i++) {
        if (checkpoints[i]) {
          totalEnl += checkpoints[i][0];
          totalRes += checkpoints[i][1];
        }
      }

      // Last CP
      let lastCP = 0;
      for (let i = checkpoints.length - 1; i > 0; i--) {
        if (checkpoints[i]) {
          lastCP = i;
          break;
        }
      }

      cachedData = {
        regionName: r.regionName || '',
        gameScore: r.gameScore || [0, 0],
        checkpoints,
        totalScore: [totalEnl, totalRes],
        lastCP,
        lastCPScore: lastCP > 0 ? checkpoints[lastCP] : [0, 0],
        topAgents: (r.topAgents || []).slice(0, 3),
      };

      notify();
    },
    () => {},
  );
}

export function getRegionData() {
  return cachedData;
}

export function setRegionData(data) {
  cachedData = data;
  notify();
}
