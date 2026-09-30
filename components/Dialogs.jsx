import { useState } from 'react';
import Modal from './Modal';
import PinPad from './PinPad';
import PinSetup from './PinSetup';
import { todayStr } from '../lib/utils';

const FALLBACK_CLASSES = ['門下生クラス', 'レッスン生クラス', 'ボイトレクラス', 'その他'];

export function EnrollDialog({ row, classes, onClose, onConfirm }) {
  const list = (classes && classes.length ? classes : FALLBACK_CLASSES);
  const [date, setDate] = useState(todayStr());
  const [cls, setCls] = useState(list.includes(row.hopeClass) ? row.hopeClass : '');
  const [addRoster, setAddRoster] = useState(true);
  return (
    <Modal title={`${row.name}さんの入門`} onClose={onClose}>
      <label className="field">
        <span>入門日(初日)</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="field">
        <span>クラス</span>
        <select value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="">選んでください</option>
          {list.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="check-line">
        <input type="checkbox" checked={addRoster} onChange={(e) => setAddRoster(e.target.checked)} />
        稽古帳の名簿にも追加する
      </label>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>やめる</button>
        <button className="btn primary" disabled={!date || !cls} onClick={() => onConfirm({ date, cls, addRoster })}>入門を記録</button>
      </div>
    </Modal>
  );
}

export function WithdrawDialog({ row, onClose, onConfirm }) {
  const [date, setDate] = useState(todayStr());
  const [step, setStep] = useState(1);
  return (
    <Modal title={`${row.name}さんの退学`} onClose={onClose}>
      {step === 1 ? (
        <>
          <label className="field">
            <span>退学日</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>やめる</button>
            <button className="btn primary" disabled={!date} onClick={() => setStep(2)}>次へ</button>
          </div>
        </>
      ) : (
        <>
          <p className="modal-text">{row.name}さんを退学にして、シートの中身を削除しますか?</p>
          <p className="muted">この操作は元に戻せません。リストには「退学」の1行だけが残ります。</p>
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>やめる</button>
            <button className="btn danger-fill" onClick={() => onConfirm(date)}>削除する</button>
          </div>
        </>
      )}
    </Modal>
  );
}

export function SettingsDialog({ pinHash, onClose, onPinChange, onLogout }) {
  const [mode, setMode] = useState('menu'); // menu | verify | new
  if (mode === 'verify') {
    return (
      <Modal title="暗証番号の変更" onClose={onClose}>
        <PinPad expectedHash={pinHash} message="今の暗証番号を入力してください" onSuccess={() => setMode('new')} />
      </Modal>
    );
  }
  if (mode === 'new') {
    return (
      <Modal onClose={onClose}>
        <PinSetup title="新しい暗証番号" onDone={(h) => { onPinChange(h); onClose(); }} onCancel={onClose} />
      </Modal>
    );
  }
  return (
    <Modal title="設定" onClose={onClose}>
      <div className="menu-list">
        <button className="btn block" onClick={() => setMode('verify')}>講師用の暗証番号を変更</button>
        <button className="btn block" onClick={() => { if (window.confirm('ログアウトしますか?')) onLogout(); }}>ログアウト</button>
        <button className="btn block" onClick={onClose}>閉じる</button>
      </div>
    </Modal>
  );
}

export function KioskExitDialog({ pinHash, onClose, onDiscard }) {
  const [ok, setOk] = useState(false);
  return (
    <Modal title="講師用" onClose={onClose}>
      {!ok ? (
        <PinPad expectedHash={pinHash} onSuccess={() => setOk(true)} />
      ) : (
        <>
          <p className="modal-text">記入を中止しますか?</p>
          <p className="muted">中止すると、ここまでの記入内容は破棄されます。</p>
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>記入に戻る</button>
            <button className="btn danger-fill" onClick={onDiscard}>中止して破棄</button>
          </div>
        </>
      )}
    </Modal>
  );
}
