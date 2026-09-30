import { useState } from 'react';
import PinPad from './PinPad';

export default function DoneScreen({ name, pinHash, onUnlock }) {
  const [showPin, setShowPin] = useState(false);
  return (
    <div className="page kiosk">
      <div className="center-screen" style={{ flex: 1 }}>
        {!showPin ? (
          <>
            <div className="done-mark">✓</div>
            <h2 className="done-title">ご記入ありがとうございました</h2>
            {name && <p className="done-name">{name} 様</p>}
            <p className="done-sub">iPadを講師にお渡しください。</p>
            <button className="link-btn teacher-open" onClick={() => setShowPin(true)}>講師用</button>
          </>
        ) : (
          <>
            <h2 className="screen-title">講師用の暗証番号</h2>
            <PinPad expectedHash={pinHash} onSuccess={onUnlock} />
            <button className="link-btn" onClick={() => setShowPin(false)}>戻る</button>
          </>
        )}
      </div>
    </div>
  );
}
