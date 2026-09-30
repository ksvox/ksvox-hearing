import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eraser, Undo2, Hand, Trash2, PenLine } from 'lucide-react';
import { PEN_COLORS, encodePoints, decodePoints, drawPath, hitsStroke } from '../lib/ink';
import { SHOKEN_SECTIONS } from '../lib/formDef';

// 所見の手書き欄。見出しと罫線は紙のシートと同じ並び
const W = 720;
const SEC_H = 132;
const FREE_TOP = SHOKEN_SECTIONS.length * SEC_H + 16;
const FREE_H = 300;
const H = FREE_TOP + FREE_H + 12;
const MAX_PIXELS = 12000000;

// initialStrokes は最初の表示時だけ読み込む(書いている途中に上書きされないように)
export default function InkPad({ initialStrokes, onChange }) {
  const outerRef = useRef(null);
  const baseRef = useRef(null);
  const liveRef = useRef(null);
  const strokesRef = useRef(initialStrokes || []);
  const history = useRef([]);
  const drawing = useRef(null);
  const erasing = useRef(false);
  const [scale, setScale] = useState(1);
  const [tool, setTool] = useState({ mode: 'pen', color: PEN_COLORS[0] });
  const [finger, setFinger] = useState(false);
  const [, force] = useState(0);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return undefined;
    const update = () => setScale(Math.max(0.3, el.clientWidth / W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ratio = useCallback(() => {
    const dpr = window.devicePixelRatio || 1;
    let k = dpr * Math.max(scale, 1);
    if (W * H * k * k > MAX_PIXELS) k = Math.sqrt(MAX_PIXELS / (W * H));
    return k;
  }, [scale]);

  const setup = (cv) => {
    const k = ratio();
    if (cv.width !== Math.round(W * k)) {
      cv.width = Math.round(W * k);
      cv.height = Math.round(H * k);
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    return ctx;
  };

  function redraw() {
    const cv = baseRef.current;
    if (!cv) return;
    const ctx = setup(cv);
    ctx.clearRect(0, 0, W, H);
    (strokesRef.current || []).forEach((s) => drawPath(ctx, decodePoints(s.p), s.c, s.w));
  }

  useEffect(() => {
    redraw();
    if (liveRef.current) setup(liveRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  const drawLive = () => {
    const cv = liveRef.current;
    const ctx = setup(cv);
    ctx.clearRect(0, 0, W, H);
    const d = drawing.current;
    if (d) drawPath(ctx, d.pts, d.color, d.width);
  };

  const commit = (next) => {
    history.current.push(strokesRef.current);
    if (history.current.length > 50) history.current.shift();
    strokesRef.current = next;
    redraw();
    onChange(next);
    force((n) => n + 1);
  };

  const toLocal = (e) => {
    const r = liveRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  };

  const canDraw = (e) => e.pointerType === 'pen' || e.pointerType === 'mouse' || finger;

  const eraseAt = (p) => {
    const list = strokesRef.current;
    const next = list.filter((s) => !hitsStroke(s, p.x, p.y, 10));
    if (next.length !== list.length) commit(next);
  };

  const onDown = (e) => {
    if (!canDraw(e)) return;
    e.preventDefault();
    try {
      liveRef.current.setPointerCapture(e.pointerId);
    } catch (err) {
      /* noop */
    }
    const p = toLocal(e);
    if (tool.mode === 'eraser') {
      erasing.current = true;
      eraseAt(p);
      return;
    }
    drawing.current = { id: e.pointerId, pts: [p.x, p.y], color: tool.color, width: 2.6 };
    drawLive();
  };

  const onMove = (e) => {
    if (erasing.current) {
      e.preventDefault();
      eraseAt(toLocal(e));
      return;
    }
    const d = drawing.current;
    if (!d || d.id !== e.pointerId) return;
    e.preventDefault();
    const evs = e.nativeEvent.getCoalescedEvents ? e.nativeEvent.getCoalescedEvents() : [];
    (evs.length ? evs : [e.nativeEvent]).forEach((ev) => {
      const p = toLocal(ev);
      const lx = d.pts[d.pts.length - 2];
      const ly = d.pts[d.pts.length - 1];
      if ((p.x - lx) ** 2 + (p.y - ly) ** 2 > 0.6) d.pts.push(p.x, p.y);
    });
    drawLive();
  };

  const finish = (e) => {
    if (erasing.current) {
      erasing.current = false;
      return;
    }
    const d = drawing.current;
    if (!d || (e && d.id !== e.pointerId)) return;
    drawing.current = null;
    drawLive();
    commit([...strokesRef.current, { c: d.color, w: d.width, p: encodePoints(d.pts) }]);
  };

  // Apple Pencilで書く時だけ画面のスクロールを止める(指のスクロールは生かす)
  useEffect(() => {
    const cv = liveRef.current;
    if (!cv) return undefined;
    const block = (ev) => {
      const ts = ev.touches ? Array.from(ev.touches) : [];
      if (ts.some((t) => t.touchType === 'stylus')) ev.preventDefault();
    };
    cv.addEventListener('touchstart', block, { passive: false });
    cv.addEventListener('touchmove', block, { passive: false });
    return () => {
      cv.removeEventListener('touchstart', block);
      cv.removeEventListener('touchmove', block);
    };
  }, []);

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    strokesRef.current = prev;
    redraw();
    onChange(prev);
    force((n) => n + 1);
  };

  return (
    <div className="inkpad">
      <div className="ink-tools">
        {PEN_COLORS.map((c) => (
          <button
            key={c}
            className={`pen-dot ${tool.mode === 'pen' && tool.color === c ? 'on' : ''}`}
            style={{ '--c': c }}
            aria-label="ペンの色"
            onClick={() => setTool({ mode: 'pen', color: c })}
          >
            <PenLine size={18} />
          </button>
        ))}
        <button className={`tool-btn ${tool.mode === 'eraser' ? 'on' : ''}`} onClick={() => setTool({ ...tool, mode: 'eraser' })}>
          <Eraser size={18} /> 消しゴム
        </button>
        <button className="tool-btn" onClick={undo} disabled={!history.current.length}>
          <Undo2 size={18} /> 戻す
        </button>
        <span className="spacer" />
        <button className={`tool-btn ${finger ? 'on' : ''}`} onClick={() => setFinger(!finger)}>
          <Hand size={18} /> 指で書く
        </button>
        <button
          className="tool-btn danger"
          disabled={!strokesRef.current.length}
          onClick={() => {
            if (window.confirm('所見の書き込みをすべて消しますか?')) commit([]);
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div ref={outerRef} className="ink-outer" style={{ height: H * scale }}>
        <div className="ink-inner" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          <div className="ink-template">
            {SHOKEN_SECTIONS.map((s, i) => (
              <div key={s} className="ink-sec" style={{ top: i * SEC_H, height: SEC_H }}>
                <span className="ink-sec-label">{s}</span>
                <span className="ink-rule" style={{ top: 58 }} />
                <span className="ink-rule" style={{ top: 112 }} />
              </div>
            ))}
            <div className="ink-free" style={{ top: FREE_TOP, height: FREE_H }}>
              <span className="ink-sec-label">メモ</span>
            </div>
          </div>
          <canvas ref={baseRef} className="ink-canvas" style={{ width: W, height: H, pointerEvents: 'none' }} />
          <canvas
            ref={liveRef}
            className={`ink-canvas ${finger ? 'finger' : 'pen-only'}`}
            style={{ width: W, height: H }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={finish}
            onPointerCancel={finish}
            onPointerLeave={(e) => {
              if (erasing.current) erasing.current = false;
              else if (drawing.current && e.pointerType === 'mouse') finish(e);
            }}
          />
        </div>
      </div>
      <p className="muted small-note">Apple Pencilで書けます。指では画面をスクロールします(「指で書く」を押すと指でも書けます)。</p>
    </div>
  );
}
