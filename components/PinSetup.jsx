import { useState } from 'react';
import PinPad from './PinPad';
import { hashPin } from '../lib/utils';

// 暗証番号の新規設定・変更(2回入力して一致したら確定)
export default function PinSetup({ title, onDone, onCancel }) {
  const [first, setFirst] = useState(null);
  const [error, setError] = useState('');

  return (
    <div className="center-screen" style={{ flex: 1 }}>
      <h2 className="screen-title">{title}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        受講者の記入が終わった後、所見の画面を開くための4桁の番号です。
      </p>
      <PinPad
        key={first ? 'second' : 'first'}
        message={first ? '確認のため、もう一度入力してください' : '新しい暗証番号(4桁)を入力してください'}
        onEntered={async (pin) => {
          if (!first) {
            setError('');
            setFirst(pin);
            return;
          }
          if (pin !== first) {
            setFirst(null);
            setError('2回の入力が一致しませんでした。最初からやり直してください。');
            return;
          }
          onDone(await hashPin(pin));
        }}
      />
      {error && <p className="error-text">{error}</p>}
      {onCancel && (
        <button className="link-btn" onClick={onCancel}>キャンセル</button>
      )}
    </div>
  );
}
