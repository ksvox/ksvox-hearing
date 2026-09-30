import { Check } from 'lucide-react';

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
