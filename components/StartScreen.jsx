import { ChevronLeft, Mic, MessageCircle, Handshake } from 'lucide-react';
import { TYPES } from '../lib/formDef';

const ICONS = { trial: Mic, counseling: MessageCircle, interview: Handshake };

export default function StartScreen({ onStart, onBack }) {
  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="一覧に戻る"><ChevronLeft size={26} /></button>
        <h1>新規受付</h1>
      </header>
      <div className="center-screen start" style={{ flex: 1 }}>
        <h2 className="screen-title">本日の受講内容を選んでください</h2>
        <p className="muted">選ぶと受付モードになり、受講者用の記入画面に切り替わります。</p>
        <div className="start-list">
          {Object.entries(TYPES).map(([key, t]) => {
            const Icon = ICONS[key];
            return (
              <button key={key} className={`start-btn ${key}`} onClick={() => onStart(key)}>
                <span className="start-icon"><Icon size={30} /></span>
                <span className="start-text">
                  <strong>{t.label}</strong>
                  <small>{t.note}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
