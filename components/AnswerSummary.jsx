import { SELF_CHECKS, MUSIC_EXP, MY_SONG, TYPES, emailOf } from '../lib/formDef';
import { calcAge } from '../lib/utils';

function Row({ label, children }) {
  if (children == null || children === '' || (Array.isArray(children) && !children.length)) return null;
  return (
    <div className="sum-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function withOther(list, other) {
  return (list || []).map((v) => (v.startsWith('その他') && other ? `${v}(${other})` : v)).join(' / ');
}

function MiniScale({ value, left, right }) {
  return (
    <span className="mini-scale">
      <small>{left}</small>
      <span className="mini-track">
        {[1, 2, 3, 4, 5].map((n) => <i key={n} className={value === n ? 'on' : ''} />)}
      </span>
      <small>{right}</small>
    </span>
  );
}

export default function AnswerSummary({ type, answers }) {
  const a = answers || {};
  const b = a.birth || {};
  const age = calcAge({ y: Number(b.y), m: Number(b.m), d: Number(b.d) });
  const birth = b.y ? `${b.y}年${b.m || '-'}月${b.d || '-'}日${age != null ? `(${age}歳)` : ''}` : '';
  const occupation = a.occupation === 'その他' && a.occupationOther ? `その他(${a.occupationOther})` : a.occupation;
  const time = a.timeFrom || a.timeTo ? `${a.timeFrom ? `${a.timeFrom}時以降` : ''}${a.timeTo ? `〜${a.timeTo}時まで` : ''}` : '';
  const exp = MUSIC_EXP.map((q) => {
    const v = a.exp?.[q.key];
    if (!v) return null;
    const d = a.exp?.[`${q.key}Detail`];
    return `${q.label}:${v}${v === 'はい' && d ? `(${d})` : ''}`;
  }).filter(Boolean);
  const song = MY_SONG.map((q) => (a.song?.[q.key] ? `${q.label}:${a.song[q.key]}` : null)).filter(Boolean);

  return (
    <div className="summary">
      <div className="sum-head">
        <span className={`type-tag ${type}`}>{TYPES[type]?.label || type}</span>
        <h2>{a.name || '(名前なし)'}<small>{a.kana}</small></h2>
      </div>
      <dl className="sum-grid">
        <Row label="生年月日">{birth}</Row>
        <Row label="職業">{occupation}</Row>
        <Row label="居住地">{a.residence}</Row>
        <Row label="電話">{a.phone}</Row>
        <Row label="メール">{emailOf(a)}</Row>
        <Row label="希望クラス">{a.hopeClass}</Row>
        <Row label="可能曜日">{(a.days || []).join('・')}</Row>
        <Row label="時間帯">{time}</Row>
      </dl>
      <dl className="sum-grid one">
        <Row label="動機">{withOther(a.motives, a.motivesOther)}</Row>
        <Row label="気になること">{withOther(a.concerns, a.concernsOther)}</Row>
        <Row label="聞きたいこと">{withOther(a.priorities, a.prioritiesOther)}</Row>
      </dl>
      <div className="sum-self">
        {SELF_CHECKS.map((s) => (
          <div key={s.key} className="sum-self-item">
            <span className="sum-self-label">{s.label.replace('(声の大きさ)', '')}</span>
            {a.self?.[s.key] ? <MiniScale value={a.self[s.key]} left={s.left} right={s.right} /> : <span className="muted">未回答</span>}
          </div>
        ))}
      </div>
      {(exp.length > 0 || song.length > 0) && (
        <div className="sum-lists">
          {exp.length > 0 && <ul>{exp.map((t) => <li key={t}>{t}</li>)}</ul>}
          {song.length > 0 && <ul>{song.map((t) => <li key={t}>{t}</li>)}</ul>}
        </div>
      )}
    </div>
  );
}
