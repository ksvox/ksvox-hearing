const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(s, withWeek = false) {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  const base = `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
  if (!withWeek) return base;
  return `${base}(${WEEK[new Date(y, m - 1, d).getDay()]})`;
}

// 受講日から3ヶ月後の日付(この日になったらシートの中身を削除)
export function expireDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1 + 3, d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function daysUntil(s) {
  const [y, m, d] = s.split('-').map(Number);
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - a) / 86400000);
}

export function newId() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `h${t}${r}`;
}

export function calcAge(birth) {
  if (!birth || !birth.y || !birth.m || !birth.d) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.y;
  if (now.getMonth() + 1 < birth.m || (now.getMonth() + 1 === birth.m && now.getDate() < birth.d)) age -= 1;
  return age;
}

export async function hashPin(pin) {
  const data = new TextEncoder().encode(`ksvox-hearing:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function quiet(promise) {
  if (promise && promise.catch) promise.catch((e) => console.warn('保存エラー:', e));
}

export function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}
