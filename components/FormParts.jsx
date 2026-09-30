import { Check } from 'lucide-react';
import { OPEN_DAYS, TIME_SLOTS, SCHEDULE_MODES } from '../lib/formDef';

export function Section({ title, hint, children }) {
  return (
    <section className="f-section">
      <div className="f-section-head">
        <h3>{title}</h3>
        {hint && <span className="f-hint">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, required, children, wide }) {
  return (
    <div className={`f-field ${wide ? 'wide' : ''}`}>
      <div className="f-label">
        {label}
        {required && <span className="req">必須</span>}
      </div>
      {children}
    </div>
  );
}

// 1つだけ選ぶ
export function Chips({ options, value, onChange, small }) {
  return (
    <div className={`chips ${small ? 'small' : ''}`}>
      {options.map((o) => (
        <button
          type="button"
          key={o}
          className={`chip ${value === o ? 'on' : ''}`}
          onClick={() => onChange(value === o ? '' : o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// 複数選ぶ(max を超えたら onLimit)
export function MultiChips({ options, values, onChange, max, onLimit, column }) {
  const toggle = (o) => {
    if (values.includes(o)) onChange(values.filter((v) => v !== o));
    else if (max && values.length >= max) onLimit && onLimit();
    else onChange([...values, o]);
  };
  return (
    <div className={`chips ${column ? 'column' : ''}`}>
      {options.map((o) => (
        <button type="button" key={o} className={`chip check ${values.includes(o) ? 'on' : ''}`} onClick={() => toggle(o)}>
          <span className="box">{values.includes(o) && <Check size={16} strokeWidth={3} />}</span>
          <span>{o}</span>
        </button>
      ))}
    </div>
  );
}

// 自己診断: 紙のシートの「縦線で示す」を、5つの位置から選ぶ形に
export function SelfScale({ label, left, right, value, onChange }) {
  return (
    <div className="scale">
      <div className="scale-label">{label}</div>
      <div className="scale-row">
        <span className="scale-end">{left}</span>
        <div className="scale-track">
          <div className="scale-line" />
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={`scale-stop ${value === n ? 'on' : ''}`}
              aria-label={`${label} ${n}`}
              onClick={() => onChange(value === n ? 0 : n)}
            >
              <span className="tick" />
            </button>
          ))}
        </div>
        <span className="scale-end">{right}</span>
      </div>
    </div>
  );
}

export function QuestionRow({ label, children }) {
  return (
    <div className="q-row">
      <div className="q-label">{label}</div>
      <div className="q-body">{children}</div>
    </div>
  );
}

function DayRow({ label, value, onChange, head }) {
  const v = value || { mode: '' };
  const pick = (mode) => {
    if (mode === 'range') onChange({ mode, from: v.from || '14:30', to: v.to || '22:00' });
    else onChange({ mode });
  };
  return (
    <div className={`day-row ${head ? 'head' : ''}`}>
      <div className="day-label">{label}</div>
      <div className="day-body">
        <div className="chips small">
          {SCHEDULE_MODES.map((m) => (
            <button type="button" key={m.key} className={`chip ${v.mode === m.key ? 'on' : ''}`} onClick={() => pick(m.key)}>
              {m.label}
            </button>
          ))}
        </div>
        {v.mode === 'range' && (
          <div className="day-time">
            <select className="f-input" value={v.from} onChange={(e) => onChange({ ...v, from: e.target.value })}>
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span>〜</span>
            <select className="f-input" value={v.to} onChange={(e) => onChange({ ...v, to: e.target.value })}>
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// レッスン可能な日時。「すべての曜日」で全体を決め、違う曜日だけ直す
export function ScheduleTable({ schedule, all, onChange }) {
  const sc = schedule || {};
  return (
    <div className="schedule">
      <p className="schedule-note">まず「すべての曜日」で全体を決めてから、違う曜日だけを直してください。(月・火は定休日です)</p>
      <DayRow
        head
        label="すべての曜日"
        value={all}
        onChange={(v) => {
          const next = {};
          OPEN_DAYS.forEach((d) => { next[d] = { ...v }; });
          onChange(next, v);
        }}
      />
      {OPEN_DAYS.map((d) => (
        <DayRow key={d} label={d} value={sc[d]} onChange={(v) => onChange({ ...sc, [d]: v }, all)} />
      ))}
    </div>
  );
}
