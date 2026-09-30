// 手書きの線データ(座標を10倍の整数にして文字列化し、軽く保存する)
export const PEN_COLORS = ['#1C2733', '#C2485A', '#2F6FD0', '#2E8B57'];

export function encodePoints(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i += 1) out.push(Math.round(pts[i] * 10));
  return out.join(' ');
}

const cache = new Map();
export function decodePoints(str) {
  if (!str) return [];
  const hit = cache.get(str);
  if (hit) return hit;
  const arr = str.split(' ').map((n) => Number(n) / 10);
  if (cache.size > 4000) cache.clear();
  cache.set(str, arr);
  return arr;
}

export function drawPath(ctx, pts, color, width) {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (pts.length === 2) {
    ctx.beginPath();
    ctx.arc(pts[0], pts[1], width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length - 2; i += 2) {
    const mx = (pts[i] + pts[i + 2]) / 2;
    const my = (pts[i + 1] + pts[i + 3]) / 2;
    ctx.quadraticCurveTo(pts[i], pts[i + 1], mx, my);
  }
  ctx.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
  ctx.stroke();
  ctx.restore();
}

export function hitsStroke(s, x, y, r) {
  const pts = decodePoints(s.p);
  const rr = (r + s.w / 2) * (r + s.w / 2);
  for (let i = 0; i < pts.length; i += 2) {
    const dx = pts[i] - x;
    const dy = pts[i + 1] - y;
    if (dx * dx + dy * dy <= rr) return true;
  }
  return false;
}
