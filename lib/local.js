// iPadの中だけに置いておくデータ(「保存」ボタンを押すまでネットには送らない)
const PENDING_KEY = 'hearing-pending';
const KIOSK_KEY = 'hearing-kiosk';
const PIN_KEY = 'hearing-pin-hash';

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}
function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('iPadへの一時保存に失敗', e);
    return false;
  }
}

// 未送信のシート
export const getPending = () => read(PENDING_KEY, []);
export const setPending = (list) => write(PENDING_KEY, list);
export function upsertPending(item) {
  const list = getPending().filter((p) => p.id !== item.id);
  list.unshift(item);
  return setPending(list);
}
export function removePending(id) {
  return setPending(getPending().filter((p) => p.id !== id));
}

// 受付モード(受講者が記入中)の状態。再読み込みしても受付モードのまま戻る
export const getKiosk = () => read(KIOSK_KEY, null);
export const setKiosk = (v) => write(KIOSK_KEY, v);

// 暗証番号(ハッシュ化したもの)
export const getLocalPin = () => read(PIN_KEY, null);
export const setLocalPin = (h) => write(PIN_KEY, h);
