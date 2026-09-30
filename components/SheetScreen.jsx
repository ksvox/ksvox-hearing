import { useState } from 'react';
import { ChevronLeft, CloudUpload } from 'lucide-react';
import AnswerSummary from './AnswerSummary';
import InkPad from './InkPad';
import Modal from './Modal';
import { formatDate } from '../lib/utils';

// シートの中身(回答のまとめ+所見の手書き)
export default function SheetScreen({ meta, sheet, unsaved, onStrokes, onBack, onDelete, onCancelEnroll, onSaveNow }) {
  const [askDelete, setAskDelete] = useState(false);
  const [askCancel, setAskCancel] = useState(false);

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="一覧に戻る"><ChevronLeft size={26} /></button>
        <h1>所見</h1>
        <span className="topbar-sub">{formatDate(meta.date, true)}</span>
        {unsaved && <span className="pill warn">未保存</span>}
        <span className="spacer" />
        {unsaved && onSaveNow ? (
          <button className="btn primary small" onClick={onSaveNow}><CloudUpload size={18} /> 保存して一覧へ</button>
        ) : (
          <button className="btn small" onClick={onBack}>一覧へ</button>
        )}
      </header>

      <div className="page-body narrow">
        {sheet === undefined && <p className="muted">読み込み中…</p>}
        {sheet === null && (
          <div className="card deleted-note">
            <p>このシートの中身は削除済みです。</p>
            <p className="muted">リストの記録({meta.name}さん)だけが残っています。</p>
          </div>
        )}
        {sheet && (
          <>
            <AnswerSummary type={meta.type} answers={sheet.answers} />
            <h3 className="ink-title">所見</h3>
            <InkPad initialStrokes={sheet.strokes || []} onChange={onStrokes} />
          </>
        )}

        <div className="danger-zone">
          {onCancelEnroll && (
            <button className="btn outline" onClick={() => setAskCancel(true)}>入門を取り消す</button>
          )}
          <button className="btn danger" onClick={() => setAskDelete(true)}>この記録を完全に削除</button>
        </div>
      </div>

      {askDelete && (
        <Modal title="記録の削除" onClose={() => setAskDelete(false)}>
          <p className="modal-text">{meta.name || 'この'}さんを本当に削除しますか?</p>
          <p className="muted">リストの行も含めてすべて消え、元に戻せません。</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setAskDelete(false)}>やめる</button>
            <button className="btn danger-fill" onClick={() => { setAskDelete(false); onDelete(); }}>削除する</button>
          </div>
        </Modal>
      )}
      {askCancel && (
        <Modal title="入門の取り消し" onClose={() => setAskCancel(false)}>
          <p className="modal-text">{meta.name}さんの入門を取り消して「検討中」に戻しますか?</p>
          <p className="muted">稽古帳の名簿に追加された分は、稽古帳の側で整理してください。</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setAskCancel(false)}>やめる</button>
            <button className="btn primary" onClick={() => { setAskCancel(false); onCancelEnroll(); }}>取り消す</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
