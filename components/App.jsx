import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc,
  updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { loadFirebaseConfig, initFirebase } from '../lib/firebase';
import { useCollectionData, useDocData, useOnline } from '../lib/useFirestore';
import { getPending, upsertPending, removePending, getKiosk, setKiosk, getLocalPin, setLocalPin } from '../lib/local';
import { emptyAnswers } from '../lib/formDef';
import { todayStr, expireDate, newId, quiet, withTimeout } from '../lib/utils';
import Login from './Login';
import PinSetup from './PinSetup';
import ListScreen from './ListScreen';
import StartScreen from './StartScreen';
import FormScreen from './FormScreen';
import DoneScreen from './DoneScreen';
import SheetScreen from './SheetScreen';
import { EnrollDialog, WithdrawDialog, SettingsDialog, KioskExitDialog } from './Dialogs';

export default function App() {
  const [phase, setPhase] = useState('loading');
  const [fb, setFb] = useState(null);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const config = await loadFirebaseConfig();
      if (!config) {
        setPhase('noconfig');
        return;
      }
      const inst = initFirebase(config);
      setFb(inst);
      unsub = onAuthStateChanged(inst.auth, (u) => setPhase(u ? 'ready' : 'login'));
    })();
    return () => unsub();
  }, []);

  if (phase === 'loading') return <div className="center-screen muted">読み込み中…</div>;
  if (phase === 'noconfig') {
    return (
      <div className="center-screen">
        <p style={{ fontSize: 20 }}>接続の準備ができませんでした。</p>
        <p className="muted">初めて開く時はネット接続が必要です。接続を確認して、もう一度開いてください。</p>
        <button className="btn outline" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>もう一度読み込む</button>
      </div>
    );
  }
  if (phase === 'login') return <Login auth={fb.auth} />;
  return <Main db={fb.db} auth={fb.auth} />;
}

// 受講日から3ヶ月たっても入門していないシートの中身を削除する(アプリを開いた時に実行)
async function cleanupExpired(db) {
  const snap = await getDocs(query(collection(db, 'hearings'), where('status', '==', 'pending')));
  const today = todayStr();
  const expired = snap.docs.filter((d) => d.data().date && expireDate(d.data().date) <= today);
  if (!expired.length) return;
  const batch = writeBatch(db);
  expired.forEach((d) => {
    batch.update(doc(db, 'hearings', d.id), { status: 'notEnrolled', sheetDeleted: true });
    batch.delete(doc(db, 'hearingSheets', d.id));
  });
  await batch.commit();
}

function Main({ db, auth }) {
  const online = useOnline();
  const hearings = useCollectionData(collection(db, 'hearings'), [db]);
  const keikoSettings = useDocData(doc(db, 'settings', 'main'), [db]);
  const [pending, setPendingState] = useState(() => getPending());
  const [kiosk, setKioskState] = useState(() => getKiosk());
  const [pinHash, setPinHash] = useState(() => getLocalPin());
  const [pinChecked, setPinChecked] = useState(!!getLocalPin());
  const [nav, setNav] = useState({ screen: 'list' });
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const refreshPending = () => setPendingState(getPending());

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  // 暗証番号: iPadの控えとFirebaseの両方に置く
  useEffect(() => {
    const ref = doc(db, 'hearingSettings', 'main');
    return onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.exists() && snap.data().pinHash) {
          setPinHash(snap.data().pinHash);
          setLocalPin(snap.data().pinHash);
          setPinChecked(true);
        } else if (!snap.metadata.fromCache) {
          const local = getLocalPin();
          if (local) quiet(setDoc(ref, { pinHash: local }));
          setPinChecked(true);
        }
      },
      () => setPinChecked(true)
    );
  }, [db]);

  const savePin = (h) => {
    setPinHash(h);
    setLocalPin(h);
    quiet(setDoc(doc(db, 'hearingSettings', 'main'), { pinHash: h }));
  };

  // 期限切れシートの自動削除(開いた時・ネットにつながった時)
  useEffect(() => {
    if (!online) return;
    cleanupExpired(db).catch((e) => console.warn('自動削除エラー', e));
  }, [db, online]);

  // ---- 受付モード ----
  const updateKiosk = (v) => {
    setKiosk(v);
    setKioskState(v);
  };
  const startKiosk = (type) => {
    updateKiosk({ stage: 'form', draft: { id: newId(), type, date: todayStr(), answers: emptyAnswers() } });
    setNav({ screen: 'list' });
  };
  const unlockKiosk = () => {
    const d = kiosk.draft;
    upsertPending({ ...d, strokes: [], createdAt: Date.now() });
    refreshPending();
    updateKiosk(null);
    setNav({ screen: 'sheet', id: d.id });
  };

  // ---- 保存(iPad → Firebase) ----
  const sendOne = async (p) => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'hearings', p.id), {
      date: p.date,
      type: p.type,
      name: p.answers.name || '',
      kana: p.answers.kana || '',
      hopeClass: p.type === 'counseling' ? '' : p.answers.hopeClass || '',
      status: 'pending',
      enrolledAt: null,
      enrolledClass: null,
      withdrawnAt: null,
      sheetDeleted: false,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, 'hearingSheets', p.id), { answers: p.answers, strokes: p.strokes || [] });
    await withTimeout(batch.commit(), 20000);
    removePending(p.id);
  };

  const saveAll = async () => {
    if (!navigator.onLine) {
      setNotice('ネットに接続してから「保存」を押してください。');
      return;
    }
    setSaving(true);
    let ok = 0;
    try {
      for (const p of getPending()) {
        // eslint-disable-next-line no-await-in-loop
        await sendOne(p);
        ok += 1;
      }
      setNotice(`${ok}件を保存しました。`);
    } catch (e) {
      console.warn(e);
      setNotice('保存できませんでした。ネット接続を確認して、もう一度「保存」を押してください。');
    } finally {
      refreshPending();
      setSaving(false);
    }
  };

  // 所見画面の「保存して一覧へ」(つながっていなければ未保存のまま一覧へ)
  const saveOneAndBack = async (id) => {
    setNav({ screen: 'list' });
    const p = getPending().find((x) => x.id === id);
    if (!p) return;
    if (!navigator.onLine) {
      setNotice('ネットにつながっていないため、iPadに一時保存しました。後で一覧の「保存」を押してください。');
      refreshPending();
      return;
    }
    setSaving(true);
    try {
      await sendOne(p);
      setNotice('保存しました。');
    } catch (e) {
      console.warn(e);
      setNotice('送信できなかったため、iPadに一時保存しました。後で一覧の「保存」を押してください。');
    } finally {
      refreshPending();
      setSaving(false);
    }
  };

  // ---- リストの行 ----
  const rows = useMemo(() => {
    const saved = (hearings || []).filter((h) => !pending.some((p) => p.id === h.id));
    const local = pending.map((p) => ({
      id: p.id, date: p.date, type: p.type, name: p.answers.name, hopeClass: p.type === 'counseling' ? '' : p.answers.hopeClass,
      status: 'unsaved', createdAtMs: p.createdAt,
    }));
    const ms = (h) => h.createdAtMs || (h.createdAt && h.createdAt.toMillis ? h.createdAt.toMillis() : 0);
    return [...local, ...saved].sort((a, b) => (a.date === b.date ? ms(b) - ms(a) : a.date < b.date ? 1 : -1));
  }, [hearings, pending]);

  // ---- 入門・退学・削除 ----
  const enroll = (row, { date, cls, addRoster }) => {
    quiet(updateDoc(doc(db, 'hearings', row.id), { status: 'enrolled', enrolledAt: date, enrolledClass: cls }));
    if (addRoster) {
      quiet(addDoc(collection(db, 'students'), {
        name: row.name, className: cls, currentSongId: null, archived: false, createdAt: serverTimestamp(),
      }));
    }
    setNotice(`${row.name}さんの入門を記録しました。${addRoster ? '稽古帳の名簿にも追加しました。' : ''}`);
  };
  const withdraw = (row, date) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'hearings', row.id), { status: 'withdrawn', withdrawnAt: date, sheetDeleted: true });
    batch.delete(doc(db, 'hearingSheets', row.id));
    quiet(batch.commit());
    setNotice(`${row.name}さんを退学にし、シートの中身を削除しました。`);
  };
  const deleteRecord = (id, isLocal) => {
    if (isLocal) {
      removePending(id);
      refreshPending();
    } else {
      quiet(deleteDoc(doc(db, 'hearingSheets', id)));
      quiet(deleteDoc(doc(db, 'hearings', id)));
    }
    setNav({ screen: 'list' });
    setNotice('記録を削除しました。');
  };

  // ---- 画面の切り替え ----
  if (!pinChecked) return <div className="center-screen muted">読み込み中…</div>;
  if (!pinHash) {
    return (
      <div className="page">
        <PinSetup title="講師用の暗証番号を設定" onDone={savePin} />
      </div>
    );
  }

  if (kiosk) {
    if (kiosk.stage === 'done') {
      return <DoneScreen name={kiosk.draft.answers.name} pinHash={pinHash} onUnlock={unlockKiosk} />;
    }
    return (
      <>
        <FormScreen
          draft={kiosk.draft}
          onChange={(d) => updateKiosk({ ...kiosk, draft: d })}
          onComplete={() => updateKiosk({ ...kiosk, stage: 'done' })}
          onTeacher={() => setDialog({ kind: 'kioskExit' })}
        />
        {dialog?.kind === 'kioskExit' && (
          <KioskExitDialog
            pinHash={pinHash}
            onClose={() => setDialog(null)}
            onDiscard={() => {
              setDialog(null);
              updateKiosk(null);
            }}
          />
        )}
      </>
    );
  }

  let screen;
  if (nav.screen === 'start') {
    screen = <StartScreen onStart={startKiosk} onBack={() => setNav({ screen: 'list' })} />;
  } else if (nav.screen === 'sheet') {
    screen = <SheetRoute key={nav.id} db={db} id={nav.id} hearings={hearings} pending={pending} refreshPending={refreshPending}
      onBack={() => setNav({ screen: 'list' })} onDelete={deleteRecord} onSaveNow={saveOneAndBack} />;
  } else {
    screen = (
      <ListScreen
        rows={rows}
        pendingCount={pending.length}
        online={online}
        saving={saving}
        onSave={saveAll}
        onNew={() => setNav({ screen: 'start' })}
        onOpen={(r) => setNav({ screen: 'sheet', id: r.id })}
        onEnroll={(r) => setDialog({ kind: 'enroll', row: r })}
        onWithdraw={(r) => setDialog({ kind: 'withdraw', row: r })}
        onSettings={() => setDialog({ kind: 'settings' })}
      />
    );
  }

  return (
    <>
      {screen}
      {dialog?.kind === 'enroll' && (
        <EnrollDialog
          row={dialog.row}
          classes={keikoSettings?.classes}
          onClose={() => setDialog(null)}
          onConfirm={(v) => { enroll(dialog.row, v); setDialog(null); }}
        />
      )}
      {dialog?.kind === 'withdraw' && (
        <WithdrawDialog row={dialog.row} onClose={() => setDialog(null)} onConfirm={(date) => { withdraw(dialog.row, date); setDialog(null); }} />
      )}
      {dialog?.kind === 'settings' && (
        <SettingsDialog pinHash={pinHash} onClose={() => setDialog(null)} onPinChange={savePin} onLogout={() => signOut(auth)} />
      )}
      {notice && <div className="toast">{notice}</div>}
    </>
  );
}

// 1件のシートを開く(未保存ならiPadから、保存済みならFirebaseから)
function SheetRoute({ db, id, hearings, pending, refreshPending, onBack, onDelete, onSaveNow }) {
  const local = pending.find((p) => p.id === id);
  const meta = (hearings || []).find((h) => h.id === id);
  const remote = useDocData(local ? null : doc(db, 'hearingSheets', id), [id, !!local]);
  const timer = useRef(null);
  const latest = useRef(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const strokes = latest.current;
    if (!strokes) return;
    latest.current = null;
    if (local) {
      const cur = getPending().find((p) => p.id === id);
      if (cur) upsertPending({ ...cur, strokes });
    } else {
      quiet(setDoc(doc(db, 'hearingSheets', id), { strokes }, { merge: true }));
    }
  }, [db, id, local]);

  useEffect(() => () => flush(), [flush]);

  const onStrokes = (strokes) => {
    latest.current = strokes;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };

  const back = () => {
    flush();
    refreshPending();
    onBack();
  };

  if (local) {
    return (
      <SheetScreen
        meta={{ date: local.date, type: local.type, name: local.answers.name }}
        sheet={{ answers: local.answers, strokes: local.strokes }}
        unsaved
        onStrokes={onStrokes}
        onBack={back}
        onSaveNow={() => {
          flush();
          onSaveNow(id);
        }}
        onDelete={() => onDelete(id, true)}
      />
    );
  }
  if (!meta) {
    return <div className="center-screen muted">読み込み中…<button className="link-btn" onClick={onBack}>一覧に戻る</button></div>;
  }
  return (
    <SheetScreen
      meta={meta}
      sheet={meta.sheetDeleted ? null : remote}
      onStrokes={onStrokes}
      onBack={back}
      onDelete={() => onDelete(id, false)}
      onCancelEnroll={meta.status === 'enrolled' ? () => {
        quiet(updateDoc(doc(db, 'hearings', id), { status: 'pending', enrolledAt: null, enrolledClass: null }));
        onBack();
      } : undefined}
    />
  );
}
