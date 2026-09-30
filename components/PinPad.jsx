import { useEffect, useState } from 'react';
import { Delete } from 'lucide-react';
import { hashPin } from '../lib/utils';

// 4桁の暗証番号入力。expectedHash があれば照合し、なければ入力値をそのまま返す
export default function PinPad({ expectedHash, onSuccess, onEntered, message }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length !== 4) return;
    const entered = pin;
    (async () => {
      if (!expectedHash) {
        setPin('');
        onEntered && onEntered(entered);
        return;
      }
      const h = await hashPin(entered);
      if (h === expectedHash) {
        setPin('');
        onSuccess && onSuccess();
      } else {
        setError('暗証番号が違います');
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin('');
        }, 450);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const press = (n) => {
    setError('');
    setPin((p) => (p.length < 4 ? p + n : p));
  };

  return (
    <div className="pinpad">
      {message && <p className="pin-msg">{message}</p>}
      <div className={`pin-dots ${shake ? 'shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      <p className="error-text pin-error">{error || '\u00a0'}</p>
      <div className="pin-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <button key={n} onClick={() => press(n)}>{n}</button>
        ))}
        <button className="sub" onClick={() => setPin('')}>クリア</button>
        <button onClick={() => press('0')}>0</button>
        <button className="sub" aria-label="1文字消す" onClick={() => setPin((p) => p.slice(0, -1))}>
          <Delete size={26} />
        </button>
      </div>
    </div>
  );
}
