import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import {
  TYPES, OCCUPATIONS, HOPE_CLASSES, WEEKDAYS, HOURS, EMAIL_DOMAINS, SELF_CHECKS, MOTIVES, CONCERNS,
  PRIORITIES, MUSIC_EXP, MY_SONG, YNU, PRIVACY_NOTE,
} from '../lib/formDef';
import { calcAge } from '../lib/utils';
import { Section, Field, Chips, MultiChips, SelfScale, QuestionRow } from './FormParts';
import Modal from './Modal';

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 86 }, (_, i) => THIS_YEAR - 5 - i);

export default function FormScreen({ draft, onChange, onComplete, onTeacher }) {
  const a = draft.answers;
  const isCounseling = draft.type === 'counseling';
  const [toast, setToast] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [missing, setMissing] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const set = (patch) => onChange({ ...draft, answers: { ...a, ...patch } });
  const setIn = (key, patch) => set({ [key]: { ...a[key], ...patch } });
  const limit3 = () => setToast('3つまで選べます。選び直す時は、選んだものをもう一度タップしてください。');
  const age = calcAge({ y: Number(a.birth.y), m: Number(a.birth.m), d: Number(a.birth.d) });

  const tryComplete = () => {
    const miss = [];
    if (!a.name.trim()) miss.push('お名前');
    if (!a.kana.trim()) miss.push('ふりがな');
    if (!a.phone.trim() && !a.emailLocal.trim()) miss.push('電話番号またはメールアドレス');
    setMissing(miss);
    if (miss.length) {
      scrollRef.current && scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setConfirm(true);
  };

  const prioritySection = (
    <Section title="今日、優先的に聞きたいこと・やりたいこと" hint="3つまで">
      <MultiChips
        column
        options={PRIORITIES}
        values={a.priorities}
        max={3}
        onLimit={limit3}
        onChange={(v) => set({ priorities: v })}
      />
      {a.priorities.includes('その他疑問') && (
        <input className="f-input mt" placeholder="聞きたいことをご記入ください" value={a.prioritiesOther} onChange={(e) => set({ prioritiesOther: e.target.value })} />
      )}
    </Section>
  );

  return (
    <div className="page kiosk">
      <header className="form-head">
        <div>
          <span className={`type-tag ${draft.type}`}>{TYPES[draft.type].label}</span>
          <h1>ヒアリングシート</h1>
        </div>
        <button className="teacher-btn" onClick={onTeacher} aria-label="講師用">
          <Lock size={16} /> 講師用
        </button>
      </header>

      <div className="form-scroll" ref={scrollRef}>
        <p className="form-lead">ご来訪ありがとうございます。分かる範囲で、ご記入ください。</p>

        {missing.length > 0 && (
          <div className="alert">「{missing.join('」「')}」をご記入ください。</div>
        )}

        <Section title="基本情報">
          <div className="f-grid">
            <Field label="お名前" required>
              <input className="f-input" autoComplete="off" placeholder="例)山田 花子" value={a.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="ふりがな" required>
              <input className="f-input" autoComplete="off" placeholder="例)やまだ はなこ" value={a.kana} onChange={(e) => set({ kana: e.target.value })} />
            </Field>
            <Field label="生年月日(西暦)" wide>
              <div className="birth">
                <select className="f-input" value={a.birth.y} onChange={(e) => setIn('birth', { y: e.target.value })}>
                  <option value="">年</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span>年</span>
                <select className="f-input" value={a.birth.m} onChange={(e) => setIn('birth', { m: e.target.value })}>
                  <option value="">月</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <span>月</span>
                <select className="f-input" value={a.birth.d} onChange={(e) => setIn('birth', { d: e.target.value })}>
                  <option value="">日</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <span>日</span>
                {age != null && <span className="age">({age}歳)</span>}
              </div>
            </Field>
            <Field label="ご職業" wide>
              <Chips options={OCCUPATIONS} value={a.occupation} onChange={(v) => set({ occupation: v })} />
              {a.occupation === 'その他' && (
                <input className="f-input mt" placeholder="ご職業" value={a.occupationOther} onChange={(e) => set({ occupationOther: e.target.value })} />
              )}
            </Field>
            <Field label="お住まい(市区まで)" wide>
              <input className="f-input" autoComplete="off" placeholder="例)東京都品川区、横浜市鶴見区" value={a.residence} onChange={(e) => set({ residence: e.target.value })} />
            </Field>
            <Field label="携帯電話" wide>
              <input className="f-input" type="tel" inputMode="tel" autoComplete="off" placeholder="例)090-1234-5678" value={a.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="メールアドレス" wide>
              <div className="email-row">
                <input
                  className="f-input"
                  type="email"
                  inputMode="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="@より前"
                  value={a.emailLocal}
                  onChange={(e) => set({ emailLocal: e.target.value.replace(/@.*/, '') })}
                />
                <span className="at">@</span>
              </div>
              <div className="chips small">
                {EMAIL_DOMAINS.map((d) => (
                  <button type="button" key={d} className={`chip ${a.emailDomain === d ? 'on' : ''} ${d === 'gmail.com' ? 'lead' : ''}`} onClick={() => set({ emailDomain: d })}>
                    {d}
                  </button>
                ))}
                <button type="button" className={`chip ${a.emailDomain === 'other' ? 'on' : ''}`} onClick={() => set({ emailDomain: 'other' })}>
                  その他
                </button>
              </div>
              {a.emailDomain === 'other' && (
                <input
                  className="f-input mt"
                  inputMode="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="@より後ろ(例: ksvox.net)"
                  value={a.emailOther}
                  onChange={(e) => set({ emailOther: e.target.value.replace(/^@/, '') })}
                />
              )}
            </Field>
          </div>
        </Section>

        {!isCounseling && (
          <Section title="ご希望について">
            <Field label="希望クラス">
              <Chips options={HOPE_CLASSES} value={a.hopeClass} onChange={(v) => set({ hopeClass: v })} />
            </Field>
            <Field label="レッスン可能な曜日" >
              <MultiChips options={WEEKDAYS} values={a.days} onChange={(v) => set({ days: v })} />
            </Field>
            <Field label="レッスン可能な時間帯">
              <div className="birth">
                <select className="f-input" value={a.timeFrom} onChange={(e) => set({ timeFrom: e.target.value })}>
                  <option value="">--</option>
                  {HOURS.map((h) => <option key={h} value={h}>{h}時</option>)}
                </select>
                <span>以降</span>
                <select className="f-input" value={a.timeTo} onChange={(e) => set({ timeTo: e.target.value })}>
                  <option value="">--</option>
                  {HOURS.map((h) => <option key={h} value={h}>{h}時</option>)}
                </select>
                <span>まで</span>
              </div>
            </Field>
          </Section>
        )}

        {isCounseling && (
          <>
            <Section title="カウンセリングを希望した動機" hint="3つまで">
              <MultiChips column options={MOTIVES} values={a.motives} max={3} onLimit={limit3} onChange={(v) => set({ motives: v })} />
              {a.motives.includes('その他') && (
                <input className="f-input mt" placeholder="動機をご記入ください" value={a.motivesOther} onChange={(e) => set({ motivesOther: e.target.value })} />
              )}
            </Section>
            <Section title="ご自分の声や歌で気になること" hint="3つまで">
              <MultiChips column options={CONCERNS} values={a.concerns} max={3} onLimit={limit3} onChange={(v) => set({ concerns: v })} />
              {a.concerns.includes('その他') && (
                <input className="f-input mt" placeholder="気になることをご記入ください" value={a.concernsOther} onChange={(e) => set({ concernsOther: e.target.value })} />
              )}
            </Section>
          </>
        )}

        {prioritySection}

        <Section title="自己診断" hint="当てはまる位置をタップしてください">
          {SELF_CHECKS.map((s) => (
            <SelfScale key={s.key} label={s.label} left={s.left} right={s.right} value={a.self[s.key]} onChange={(v) => setIn('self', { [s.key]: v })} />
          ))}
        </Section>

        <Section title="音楽経験について">
          {MUSIC_EXP.map((q) => (
            <QuestionRow key={q.key} label={q.label}>
              <Chips small options={['はい', 'いいえ']} value={a.exp[q.key]} onChange={(v) => setIn('exp', { [q.key]: v })} />
              {q.detail && a.exp[q.key] === 'はい' && (
                <input
                  className="f-input mt"
                  placeholder={q.detail}
                  value={a.exp[`${q.key}Detail`]}
                  onChange={(e) => setIn('exp', { [`${q.key}Detail`]: e.target.value })}
                />
              )}
            </QuestionRow>
          ))}
        </Section>

        <Section title="ご自分の歌について">
          {MY_SONG.map((q) => (
            <QuestionRow key={q.key} label={q.label}>
              <Chips small options={YNU} value={a.song[q.key]} onChange={(v) => setIn('song', { [q.key]: v })} />
            </QuestionRow>
          ))}
        </Section>

        <p className="privacy">※{PRIVACY_NOTE}</p>

        <button className="btn primary block huge" onClick={tryComplete}>記入を完了する</button>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {confirm && (
        <Modal title="記入を完了しますか?" onClose={() => setConfirm(false)}>
          <p className="muted">完了すると、ご自身では修正できなくなります。</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setConfirm(false)}>見直す</button>
            <button className="btn primary" onClick={() => { setConfirm(false); onComplete(); }}>完了する</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
