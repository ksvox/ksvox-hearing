import { useMemo, useState } from 'react';
import { Plus, CloudUpload, Settings, WifiOff } from 'lucide-react';
import { TYPES } from '../lib/formDef';
import { formatDate, expireDate, daysUntil } from '../lib/utils';

const FILTERS = [
  { key: 'all', label: 'すべて' },
  { key: 'pending', label: '検討中' },
  { key: 'enrolled', label: '入門' },
  { key: 'closed', label: '未入門・退学' },
];

function statusText(r) {
  if (r.status === 'unsaved') return <span className="pill warn">未保存</span>;
  if (r.status === 'enrolled') return <span className="st enrolled">入門 {formatDate(r.enrolledAt)}</span>;
  if (r.status === 'withdrawn') return <span className="st">退学 {formatDate(r.withdrawnAt)}</span>;
  if (r.status === 'notEnrolled') return <span className="st">未入門</span>;
  const left = daysUntil(expireDate(r.date));
  return (
    <span className="st pending">
      検討中
      <small>{left > 0 ? `あと${left}日で削除` : 'まもなく削除'}</small>
    </span>
  );
}

export default function ListScreen({ rows, pendingCount, online, saving, onSave, onNew, onOpen, onEnroll, onWithdraw, onSettings }) {
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => {
    const c = { all: rows.length, pending: 0, enrolled: 0, closed: 0 };
    rows.forEach((r) => {
      if (r.status === 'pending' || r.status === 'unsaved') c.pending += 1;
      else if (r.status === 'enrolled') c.enrolled += 1;
      else c.closed += 1;
    });
    return c;
  }, [rows]);

  const shown = rows.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'pending' || r.status === 'unsaved';
    if (filter === 'enrolled') return r.status === 'enrolled';
    return r.status === 'notEnrolled' || r.status === 'withdrawn';
  });

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand-mark">聴</div>
        <div className="brand-text">
          <h1>ヒアリングシート</h1>
          <span>K's VOX</span>
        </div>
        <span className="spacer" />
        {!online && <span className="pill"><WifiOff size={14} /> オフライン</span>}
        {pendingCount > 0 && (
          <button className="btn save" onClick={onSave} disabled={saving}>
            <CloudUpload size={20} /> {saving ? '保存中…' : '保存'}
            <span className="count">{pendingCount}</span>
          </button>
        )}
        <button className="btn primary" onClick={onNew}><Plus size={20} /> 新規受付</button>
        <button className="icon-btn" onClick={onSettings} aria-label="設定"><Settings size={22} /></button>
      </header>

      <div className="page-body">
        <div className="filters">
          {FILTERS.map((f) => (
            <button key={f.key} className={`filter ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}<span>{counts[f.key]}</span>
            </button>
          ))}
        </div>

        <div className="list">
          <div className="list-head">
            <span>受講日</span><span>受講内容</span><span>氏名</span><span>希望クラス</span><span>入門有無</span><span />
          </div>
          {shown.length === 0 && <p className="muted empty">該当する記録はありません。</p>}
          {shown.map((r) => {
            const closed = r.status === 'notEnrolled' || r.status === 'withdrawn';
            return (
              <div key={r.id} className={`list-row ${closed ? 'closed' : ''}`} onClick={() => onOpen(r)}>
                <span className="c-date">{formatDate(r.date)}</span>
                <span><span className={`type-tag ${r.type}`}>{TYPES[r.type]?.short || r.type}</span></span>
                <span className="c-name">{r.name || '(名前なし)'}</span>
                <span className="c-class">{r.hopeClass || '―'}</span>
                <span>{statusText(r)}</span>
                <span className="c-act" onClick={(e) => e.stopPropagation()}>
                  {(r.status === 'pending' || r.status === 'unsaved') && (
                    <button
                      className="enroll-btn"
                      disabled={r.status === 'unsaved'}
                      title={r.status === 'unsaved' ? '先に「保存」を押してください' : ''}
                      onClick={() => onEnroll(r)}
                    >
                      入門
                    </button>
                  )}
                  {r.status === 'enrolled' && (
                    <>
                      <span className="enroll-btn done">入門</span>
                      <button className="withdraw-btn" onClick={() => onWithdraw(r)}>退学</button>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
